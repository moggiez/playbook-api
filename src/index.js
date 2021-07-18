"use strict";
const AWS = require("aws-sdk");

const db = require("moggies-db");
const helpers = require("moggies-lambda-helpers");
const auth = require("moggies-auth");

const { Handler } = require("./handler");

const DEBUG = false;

const debug = (response) => {
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

exports.handler = function (event, context, callback) {
  const response = helpers.getResponseFn(callback);
  debug(response);

  const table = new db.Table({
    config: db.tableConfigs.playbook_versions,
    AWS: AWS,
  });
  const handler = new Handler(table);

  handler.handle(getRequest(event), response);
};
