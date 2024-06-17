import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

export class FargateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'RbpAppVpc', {
      maxAzs: 3,
    });

    const cluster = new ecs.Cluster(this, 'RbpAppCluster', {
      vpc,
      clusterName: 'rbp-app-cluster',
    });

    // Task Definition
    const executionRole = new iam.Role(this, 'ExecutionRole', {
      roleName: 'ExecutionRole',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'RbpAppTaskDef',
      {
        family: 'rbp-app-task-def',
        executionRole: executionRole,
      },
    );

    const ecrRepoArn = cdk.Fn.importValue('EcrRepositoryArn');
    const ecrRepo = ecr.Repository.fromRepositoryAttributes(
      this,
      'RbpEcrRepo',
      {
        repositoryArn: ecrRepoArn,
        repositoryName: 'rbp-app-repo', // Provide the repository name here
      },
    );

    taskDefinition.addContainer('RbpAppContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
      containerName: 'rbp-app',
      portMappings: [
        {
          protocol: ecs.Protocol.TCP,
          appProtocol: ecs.AppProtocol.http,
          containerPort: 3000,
          name: 'rbp-app-port-mapping',
        },
      ],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'rbp-app' }),
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/ || exit 1'],
        interval: cdk.Duration.seconds(120),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(10),
      },
    });

    // Service
    const httpInboundSecurityGroup = new ec2.SecurityGroup(
      this,
      'RbpAppServiceSG',
      {
        vpc,
        securityGroupName: 'rbp-app-service-sg',
      },
    );

    httpInboundSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere',
    );

    const loadbalancer = new elbv2.ApplicationLoadBalancer(this, 'RbpAppLb', {
      vpc,
      internetFacing: true,
    });

    const listener = loadbalancer.addListener('RbpAppListener', {
      port: 80,
      open: true,
    });

    const service = new ecs.FargateService(this, 'RbpAppService', {
      serviceName: 'rbp-app-service',
      cluster,
      taskDefinition,
      desiredCount: 1,
      circuitBreaker: { enable: true, rollback: true },
      deploymentController: { type: ecs.DeploymentControllerType.ECS },
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroups: [httpInboundSecurityGroup],
      assignPublicIp: true,
    });

    const targetGroup = listener.addTargets('RbpAppTargetGroup', {
      port: 80,
      targets: [service],
      targetGroupName: 'rbp-app-tg',
      protocol: elbv2.ApplicationProtocol.HTTP,
      deregistrationDelay: cdk.Duration.seconds(300),
    });

    targetGroup.configureHealthCheck({
      protocol: elbv2.Protocol.HTTP,
      path: '/',
      interval: cdk.Duration.seconds(120),
    });

    // Service Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      // Time between scaling operations
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(300),
    });
  }
}
