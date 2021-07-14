"use strict";

const db = require("moggies-db");
const table = new db.Table(db.tableConfigs.playbooks);
const mapper = require("./mapper");
const config = require("./config");

exports.get = (organisationId, playbookId, response) => {
  let promise = null;
  if (playbookId) {
    promise = table.get(organisationId, playbookId);
  } else {
    promise = table.getByPartitionKey(organisationId);
  }

  promise
    .then((data) => {
      const responseBody =
        "Items" in data
          ? {
              data: data.Items.map(mapper.map),
            }
          : mapper.map(data.Item);
      response(200, responseBody, config.headers);
    })
    .catch((err) => {
      response(500, err, config.headers);
    });
};

exports.post = (organisationId, playbookId, payload, response) => {
  table
    .create(organisationId, playbookId, payload)
    .then((data) => response(200, data, config.headers))
    .catch((err) => response(500, err, config.headers));
};

exports.put = (organisationId, playbookId, payload, response) => {
  table
    .update(organisationId, playbookId, payload)
    .then((data) => response(200, data, config.headers))
    .catch((err) => response(500, err, config.headers));
};

exports.delete = (organisationId, playbookId, response) => {
  table
    .delete(organisationId, userId)
    .then((data) => response(200, data, config.headers))
    .catch((err) => response(500, err, config.headers));
};
