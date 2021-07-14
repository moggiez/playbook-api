"use strict";

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
      const data = await table.query({
        hashKey: organisationId,
        sortKey: playbookId,
        indexName: "OrganisationPlaybooks",
        filter: {
          expression: "Version = :version",
          attributes: { version: v },
        },
      });
      const items = "Items" in data ? data.Items : [data.Item];
      const latestOnly = items.filter((item, index) => item.Version == v);

      return latestOnly.length > 0 ? latestOnly[0] : null;
    } catch (err) {
      throw err;
    }
  };

  _getPlaybookVersions = async (playbookId) => {
    try {
      const data = await table.query({
        hashKey: playbookId,
      });
      const items = "Items" in data ? data.Items : [data.Item];
      const latestOnly = items.filter((item, index) => item.Version == v);

      return latestOnly;
    } catch (err) {
      throw err;
    }
  };

  get = async (organisationId, playbookId, version, response) => {
    try {
      response(
        200,
        await this._getPlaybook(organisationId, playbookId, version)
      );
    } catch (err) {
      response(500, err);
    }
  };

  post = async (organisationId, playbookId, payload, response) => {
    try {
      const record = { ...payload };
      record.OrgnisationId = organisationId;

      const data = await this.table.create({
        hashKey: playbookId,
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
      record.OrgnisationId = organisationId;
      const data = await this.table.update({
        hashKey: playbookId,
        sortKey: "v0",
        record,
      });

      const latestVersion = `v${data.Latest}`;
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
        if (pb.OrgnisationId != organisationId) {
          throw new Error(403, "Forbidden");
        }
      });
      for (i = 0; i < playbookVersions.length; i++) {
        await this.table.delete(pb.PlaybookId, pb.Version);
      }
      response(200, {});
    } catch (err) {
      response(500, err, config.headers);
    }
  };
}

exports.Handler = Handler;
