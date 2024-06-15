#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
// import { AwsCdkFargateStack } from '../lib/aws-cdk-fargate-stack';
import { TrustStack } from '../lib/gh-trust-stack';
// import { LambdaStack } from '../lib/lambda-stack';

const app = new cdk.App();

new TrustStack(app, 'TrustStack', {});
// new LambdaStack(app, 'LambdaStack', {});
