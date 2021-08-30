"use strict";
const AWS = require("aws-sdk");

const db = require("@moggiez/moggies-db");
const helpers = require("@moggiez/moggies-lambda-helpers");
const auth = require("@moggiez/moggies-auth");

const { Handler } = require("./handler");

const DEBUG = false;

const TABLE_CONFIG = {
  tableName: "playbook_versions",
  hashKey: "PlaybookId",
  sortKey: "Version",
  indexes: {
    OrganisationPlaybooks: {
      hashKey: "OrganisationId",
      sortKey: "PlaybookId",
    },
  },
};

const debug = (event, response) => {
  if (DEBUG) {
    response(200, event);
  }
};

const getRequest = (event) => {
  const user = auth.getUserFromEvent(event);
  const request = helpers.getRequestFromEvent(event);
  request.user = user;

  return request;
};

exports.handler = async function (event, context, callback) {
  const response = helpers.getResponseFn(callback);
  debug(event, response);

  const table = new db.Table({
    config: TABLE_CONFIG,
    AWS: AWS,
  });
  const handler = new Handler(table);

  await handler.handle(getRequest(event), response);
};
