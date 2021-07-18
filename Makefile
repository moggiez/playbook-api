TF_BACKEND_CFG=-backend-config="bucket=moggies.io-terraform-state-backend" -backend-config="dynamodb_table=moggies.io-playbooks-api-terraform_state" -backend-config="key=playbooks-api-terraform.state" -backend-config="region=eu-west-1"

# INFRASTRUCTURE
modules-cleanup:
	cd infra && rm -rf .terraform/modules

infra-fmt:
	cd infra && terraform fmt -recursive

infra-init:
	cd infra && terraform init -force-copy ${TF_BACKEND_CFG}

infra-debug:
	cd infra && TF_LOG=DEBUG terraform apply -auto-approve infra

infra-deploy: modules-cleanup
	cd infra && terraform init && terraform apply -auto-approve

infra-preview: modules-cleanup
	cd infra && terraform init && terraform plan

# CODE
build-cleanup:
	rm -rf ./dist/* & mkdir -p dist && rm -rf ./src/node_modules

build: build-cleanup
	cd src && npm i --only=prod && zip -r ../dist/playbooks-api.zip ./

build-dev: build-cleanup
	cd src && npm i

lint:
	cd src && npm run lint

format:
	cd src && npm run format

test:
	cd src && npm run test

update-lambda-fn:
	aws lambda update-function-code --function-name playbooks-api --zip-file fileb://$(shell pwd)/dist/playbooks-api.zip --publish | jq .FunctionArn

# NPM COMMANDS
npm-auth:
	aws codeartifact login --tool npm --repository team-npm --domain moggies-io --domain-owner 989665778089