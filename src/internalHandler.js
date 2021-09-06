"use strict";

const uuid = require("uuid");

class InternalHandler {
  constructor({ table }) {
    const expectedTableName = "playbook_versions";
    if (table && table.getConfig().tableName != expectedTableName) {
      throw new Error(
        `Constructor expects '${expectedTableName}' table passed. The passed table name does not match '${expectedTableName}'.`
      );
    }
    this.table = table;
  }

  handle = async (event) => {
    const actionMethod = this[event.action];
    if (!actionMethod) {
      throw Error("Not supported action.");
    }
    const actionParameters = event.parameters;

    return actionMethod(actionParameters);
  };

  getPlaybook = async ({ organisationId, playbookId, version }) => {
    try {
      const v = version ? version : "v0";
      const queryParams = {
        hashKey: organisationId,
        sortKey: playbookId,
        indexName: "OrganisationPlaybooks",
        filter: {
          expression: "Version = :version",
          attributes: { version: v },
        },
      };
      const data = await this.table.query(queryParams);
      const items = "Items" in data ? data.Items : [data.Item];
      const latestOnly = items.filter((item, _) => item.Version == v);

      return latestOnly.length > 0 ? latestOnly[0] : "";
    } catch (err) {
      throw err;
    }
  };
}

exports.InternalHandler = InternalHandler;
