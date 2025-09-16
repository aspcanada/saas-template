// CDK App entry point
import { App } from "aws-cdk-lib";
import { CoreStack, ApiStack } from "./index";

const app = new App();

// Deploy CoreStack first
const coreStack = new CoreStack(app, "SaasTemplateCore", {
  description: "Core infrastructure for SaaS Template",
});

// Deploy ApiStack with dependency on CoreStack
const apiStack = new ApiStack(app, "SaasTemplateApi", {
  description: "API infrastructure for SaaS Template",
  coreStack: coreStack,
});

// Add dependency
apiStack.addDependency(coreStack);

app.synth();
