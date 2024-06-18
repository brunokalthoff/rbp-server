import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class EcrStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ecrRepo = new ecr.Repository(this, 'RbpEcrRepo', {
      repositoryName: 'rbp-app-repo',
    });

    new cdk.CfnOutput(this, 'EcrRepositoryArn', {
      exportName: 'EcrRepositoryArn',
      value: ecrRepo.repositoryArn,
      description: 'ARN of the ECR repository',
    });
  }
}
