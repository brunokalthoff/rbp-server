#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GitHubTrustStack } from '../lib/gh-trust-stack';
import { FargateStack } from '../lib/fargate-stack';
import { EcrStack } from '../lib/ecr-stack';
const app = new cdk.App();

new GitHubTrustStack(app, 'GitHubTrustStack', {});
new EcrStack(app, 'EcrStack', {});
new FargateStack(app, 'FargateStack', {});
