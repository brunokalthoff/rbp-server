import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class TrustStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const GITHUB_REPOSITORY =
      process.env.REPO_NAME || 'brunokalthoff/rbp-server';

    const githubProvider = new iam.CfnOIDCProvider(this, 'GitHubOIDCProvider', {
      thumbprintList: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
      url: 'https://token.actions.githubusercontent.com',
      clientIdList: ['sts.amazonaws.com'],
    });

    const githubPrinciple = new iam.FederatedPrincipal(
      githubProvider.attrArn,
      {
        StringLike: {
          'token.actions.githubusercontent.com:sub': [
            `repo:${GITHUB_REPOSITORY}:ref:refs/heads/main`,
            `repo:${GITHUB_REPOSITORY}:ref:refs/heads/wf`,
          ],
        },
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
      },
      'sts:AssumeRoleWithWebIdentity',
    );

    // CDK Role
    const cdkDeploymentRole = new iam.Role(this, 'CdkDeploymentRole', {
      assumedBy: githubPrinciple,
    });

    const assumeCdkDeploymentRoles = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      resources: ['arn:aws:iam::*:role/cdk-*'],
      conditions: {
        StringEquals: {
          'aws:ResourceTag/aws-cdk:bootstrap-role': [
            'file-publishing',
            'lookup',
            'deploy',
          ],
        },
      },
    });

    cdkDeploymentRole.addToPolicy(assumeCdkDeploymentRoles);

    new cdk.CfnOutput(this, 'GitHubActionsRoleArn', {
      value: cdkDeploymentRole.roleArn,
      description: 'The role ARN for GitHub Actions to use during deployment.',
    });

    // ECR ECS Role
    const ecrEcsDeploymentRole = new iam.Role(this, 'EcrEcsDeploymentRole', {
      assumedBy: githubPrinciple,
    });

    const ecrEcsPassRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: [
        'arn:aws:iam::*:role/AwsFargateStack-RbpAppTaskDefExecutionRole*',
      ],
    });

    const uploadImagePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'ecr:CompleteLayerUpload',
        'ecr:GetAuthorizationToken',
        'ecr:DescribeRepositories',
        'ecr:UploadLayerPart',
        'ecr:ListImages',
        'ecr:InitiateLayerUpload',
        'ecr:BatchCheckLayerAvailability',
        'ecr:PutImage',
        'ecs:UpdateService',
        'ecs:RegisterTaskDefinition',
        'ecs:DescribeServices',
        'ecs:DescribeTaskDefinition',
        'ecs:DescribeClusters',
      ],
      resources: ['*'],
    });

    ecrEcsDeploymentRole.addToPolicy(ecrEcsPassRolePolicy);
    ecrEcsDeploymentRole.addToPolicy(uploadImagePolicy);

    new cdk.CfnOutput(this, 'EcrEcsDeploymentRoleArn', {
      value: ecrEcsDeploymentRole.roleArn,
      description: 'The role ARN for GitHub Actions to deploy to ECS and ECR.',
    });
  }
}
