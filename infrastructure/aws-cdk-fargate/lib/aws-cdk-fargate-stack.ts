import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class AwsCdkFargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'RbpAppVpc', {
      maxAzs: 3,
    });

    const loadbalancer = new elbv2.ApplicationLoadBalancer(this, 'RbpAppLb', {
      vpc,
      internetFacing: true,
    });

    const cluster = new ecs.Cluster(this, 'RbpAppCluster', {
      vpc,
      clusterName: 'rbp-app-cluster',
    });

    new ecr.Repository(this, 'RbpEcrRepo', {
      repositoryName: 'rbp-app-repo',
    });

    const executionRole = new iam.Role(this, 'ExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'RbpAppService',
      {
        cluster,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
          containerName: 'rbp-app',
          containerPort: 3000,
          executionRole,
        },
        cpu: 256,
        memoryLimitMiB: 512,
        desiredCount: 1,
        serviceName: 'rbp-app-service',
        loadBalancer: loadbalancer,
      },
    );
  }
}
