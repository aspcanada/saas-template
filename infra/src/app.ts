// CDK App entry point
import { App } from "aws-cdk-lib";
import { CoreStack } from "./index";

const app = new App();

new CoreStack(app, "SaasTemplateCore", {
  description: "Core infrastructure for SaaS Template",
});

app.synth();
