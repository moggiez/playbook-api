"use strict";

const uuid = require("uuid");
const config = require("./config");
const helpers = require("moggies-lambda-helpers");
const handlers = require("./handlers");

exports.handler = function (event, context, callback) {
  const response = helpers.getResponseFn(callback);

  if (config.DEBUG) {
    response(200, event, config.headers);
  }
  const request = helpers.getRequestFromEvent(event);

  try {
    const organisationId = request.getPathParamAtIndex(0, "");
    const playbookId = request.getPathParamAtIndex(1, null);
    const playbook = request.body;

    if (request.httpMethod == "GET") {
      handlers.get(organisationId, playbookId, response);
    } else if (request.httpMethod == "POST") {
      handlers.post(organisationId, uuid.v4(), playbook, response);
    } else if (request.httpMethod == "PUT") {
      handlers.put(organisationId, playbookId, playbook, response);
    } else {
      response(403, "Not supported.", config.headers);
    }
  } catch (err) {
    response(500, err, config.headers);
  }
};
