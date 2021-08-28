"use strict";
const uuid = require("uuid");

class Handler {
  constructor(table) {
    const expectedTableName = "playbook_versions";
    if (table && table.getConfig().tableName != expectedTableName) {
      throw new Error(
        `Constructor expects '${expectedTableName}' table passed. The passed table name does not match '${expectedTableName}'.`
      );
    }
    this.table = table;
  }

  _getPlaybook = async (organisationId, playbookId, version) => {
    try {
      const v = version ? version : "v0";
      const data = await this.table.query({
        hashKey: organisationId,
        sortKey: playbookId,
        indexName: "OrganisationPlaybooks",
        filter: {
          expression: "Version = :version",
          attributes: { version: v },
        },
      });
      const items = "Items" in data ? data.Items : [data.Item];
      const latestOnly = items.filter((item, _) => item.Version == v);

      return latestOnly.length > 0 ? latestOnly[0] : "";
    } catch (err) {
      throw err;
    }
  };

  _getAllPlaybooks = async (organisationId) => {
    try {
      const data = await this.table.query({
        hashKey: organisationId,
        indexName: "OrganisationPlaybooks",
        filter: {
          expression: "Version = :version",
          attributes: { version: "v0" },
        },
      });

      return data.Items;
    } catch (err) {
      throw err;
    }
  };

  _getPlaybookVersions = async (playbookId) => {
    try {
      const data = await this.table.query({
        hashKey: playbookId,
      });

      return "Items" in data ? data.Items : [data.Item];
    } catch (err) {
      throw err;
    }
  };

  handle = async (req, res) => {
    try {
      if (req.httpMethod == "GET") {
        this.get(
          req.pathParameters.organisationId,
          "playbookId" in req.pathParameters
            ? req.pathParameters.playbookId
            : null,
          "version" in req.pathParameters ? req.pathParameters.version : "v0",
          res
        );
      } else if (req.httpMethod == "POST") {
        this.post(req.pathParameters.organisationId, req.body, res);
      } else if (req.httpMethod == "PUT") {
        this.put(
          req.pathParameters.organisationId,
          req.pathParameters.playbookId,
          req.body,
          res
        );
      } else if (req.httpMethod == "DELETE") {
        this.delete(
          req.pathParameters.organisationId,
          req.pathParameters.playbookId,
          res
        );
      } else {
        res(500, "Not supported.");
      }
    } catch (err) {
      res(500, err);
    }
  };

  get = async (organisationId, playbookId, version, response) => {
    try {
      if (playbookId) {
        response(
          200,
          await this._getPlaybook(organisationId, playbookId, version)
        );
      } else {
        response(200, await this._getAllPlaybooks(organisationId));
      }
    } catch (err) {
      response(500, err);
    }
  };

  post = async (organisationId, payload, response) => {
    try {
      const record = { ...payload };
      record.OrganisationId = organisationId;

      const data = await this.table.create({
        hashKey: uuid.v4(),
        sortKey: "v0",
        record,
      });

      response(200, data);
    } catch (err) {
      response(500, err);
    }
  };

  put = async (organisationId, playbookId, payload, response) => {
    try {
      const record = { ...payload };
      record.OrganisationId = organisationId;
      const data = await this.table.update({
        hashKey: playbookId,
        sortKey: "v0",
        updatedFields: record,
      });

      const latestVersion = `v${data.Attributes.Latest}`;
      const newVersionData = await this.table.create({
        hashKey: playbookId,
        sortKey: latestVersion,
        record,
      });

      response(200, newVersionData);
    } catch (err) {
      response(500, err);
    }
  };

  delete = async (organisationId, playbookId, response) => {
    try {
      const playbookVersions = await this._getPlaybookVersions(playbookId);
      playbookVersions.forEach((pb, _) => {
        if (pb.OrganisationId != organisationId) {
          throw new Error(403, "Forbidden");
        }
      });
      for (let i = 0; i < playbookVersions.length; i++) {
        const pb = playbookVersions[i];
        await this.table.delete({
          hashKey: pb.PlaybookId,
          sortKey: pb.Version,
        });
      }
      response(200, {});
    } catch (err) {
      response(500, err);
    }
  };
}

exports.Handler = Handler;
