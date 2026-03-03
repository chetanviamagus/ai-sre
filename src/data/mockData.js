export const MOCK_DATA = {
  projects: [
    { id: 'p1', name: 'E-Commerce Platform' },
    { id: 'p2', name: 'Identity & Auth' }
  ],

  nodes: [
    // ── LEVEL 0: Clusters ───────────────────────────────────────────────
    { id: 'c1', projectId: 'p1', level: 0, type: 'clusterNode', data: { label: 'us-west-2 Production', health: 'Warning'  }, position: { x: 80,  y: 50  } },
    { id: 'c2', projectId: 'p1', level: 0, type: 'clusterNode', data: { label: 'us-east-1 Production', health: 'Healthy'  }, position: { x: 450, y: 50  } },
    { id: 'c3', projectId: 'p1', level: 0, type: 'clusterNode', data: { label: 'Data Platform',         health: 'Critical' }, position: { x: 270, y: 350 } },

    // ── LEVEL 1: Namespaces / Sub-clusters ──────────────────────────────
    // c1 → us-west-2
    { id: 'sc1', projectId: 'p1', parentId: 'c1', level: 1, type: 'subClusterNode', data: { label: 'checkout-namespace', health: 'Critical' }, position: { x: 0,   y: 0 } },
    { id: 'sc2', projectId: 'p1', parentId: 'c1', level: 1, type: 'subClusterNode', data: { label: 'user-namespace',     health: 'Healthy'  }, position: { x: 320, y: 0 } },

    // c2 → us-east-1
    { id: 'sc5', projectId: 'p1', parentId: 'c2', level: 1, type: 'subClusterNode', data: { label: 'api-gateway-ns', health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 'sc6', projectId: 'p1', parentId: 'c2', level: 1, type: 'subClusterNode', data: { label: 'auth-namespace', health: 'Healthy' }, position: { x: 280, y: 0 } },

    // c3 → Data Platform
    { id: 'sc3', projectId: 'p1', parentId: 'c3', level: 1, type: 'subClusterNode', data: { label: 'streaming-platform',  health: 'Critical' }, position: { x: 0,   y: 0 } },
    { id: 'sc4', projectId: 'p1', parentId: 'c3', level: 1, type: 'subClusterNode', data: { label: 'analytics-platform',  health: 'Warning'  }, position: { x: 300, y: 0 } },

    // ── LEVEL 2: Workloads / Groups ─────────────────────────────────────
    // sc1 → checkout-namespace
    { id: 'g1', projectId: 'p1', parentId: 'sc1', level: 2, type: 'groupNode', data: { label: 'payment-workloads', health: 'Critical' }, position: { x: 0,   y: 0   } },
    { id: 'g2', projectId: 'p1', parentId: 'sc1', level: 2, type: 'groupNode', data: { label: 'order-workloads',   health: 'Warning'  }, position: { x: 250, y: 0   } },
    { id: 'g3', projectId: 'p1', parentId: 'sc1', level: 2, type: 'groupNode', data: { label: 'cart-workloads',    health: 'Healthy'  }, position: { x: 125, y: 160 } },

    // sc2 → user-namespace
    { id: 'g9',  projectId: 'p1', parentId: 'sc2', level: 2, type: 'groupNode', data: { label: 'profile-services',      health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 'g10', projectId: 'p1', parentId: 'sc2', level: 2, type: 'groupNode', data: { label: 'notification-services', health: 'Healthy' }, position: { x: 230, y: 0 } },

    // sc3 → streaming-platform
    { id: 'g4', projectId: 'p1', parentId: 'sc3', level: 2, type: 'groupNode', data: { label: 'kafka-cluster', health: 'Critical' }, position: { x: 0,   y: 0 } },
    { id: 'g5', projectId: 'p1', parentId: 'sc3', level: 2, type: 'groupNode', data: { label: 'flink-jobs',    health: 'Warning'  }, position: { x: 250, y: 0 } },

    // sc4 → analytics-platform
    { id: 'g11', projectId: 'p1', parentId: 'sc4', level: 2, type: 'groupNode', data: { label: 'spark-jobs',    health: 'Warning' }, position: { x: 0,   y: 0 } },
    { id: 'g12', projectId: 'p1', parentId: 'sc4', level: 2, type: 'groupNode', data: { label: 'data-warehouse', health: 'Healthy' }, position: { x: 220, y: 0 } },

    // sc5 → api-gateway-ns
    { id: 'g6', projectId: 'p1', parentId: 'sc5', level: 2, type: 'groupNode', data: { label: 'gateway-services', health: 'Healthy' }, position: { x: 0, y: 0 } },

    // sc6 → auth-namespace
    { id: 'g8', projectId: 'p1', parentId: 'sc6', level: 2, type: 'groupNode', data: { label: 'auth-services', health: 'Healthy' }, position: { x: 0, y: 0 } },

    // ── LEVEL 3: Services ────────────────────────────────────────────────
    // g1 → payment-workloads
    { id: 's1', projectId: 'p1', parentId: 'g1', level: 3, type: 'groupNode',   data: { label: 'payment-api',       health: 'Critical' }, position: { x: 0,   y: 0  } }, // has L4 pods
    { id: 's2', projectId: 'p1', parentId: 'g1', level: 3, type: 'serviceNode', data: { label: 'payment-processor', health: 'Warning'  }, position: { x: 180, y: 0  } },
    { id: 's3', projectId: 'p1', parentId: 'g1', level: 3, type: 'serviceNode', data: { label: 'fraud-detector',    health: 'Healthy'  }, position: { x: 90,  y: 90 } },

    // g2 → order-workloads
    { id: 's4', projectId: 'p1', parentId: 'g2', level: 3, type: 'serviceNode', data: { label: 'order-api',         health: 'Warning'  }, position: { x: 0,   y: 0 } },
    { id: 's5', projectId: 'p1', parentId: 'g2', level: 3, type: 'serviceNode', data: { label: 'inventory-service', health: 'Healthy'  }, position: { x: 180, y: 0 } },

    // g3 → cart-workloads
    { id: 's6', projectId: 'p1', parentId: 'g3', level: 3, type: 'serviceNode', data: { label: 'cart-api',     health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 's7', projectId: 'p1', parentId: 'g3', level: 3, type: 'serviceNode', data: { label: 'session-store', health: 'Healthy' }, position: { x: 160, y: 0 } },

    // g4 → kafka-cluster
    { id: 's8',  projectId: 'p1', parentId: 'g4', level: 3, type: 'groupNode',   data: { label: 'kafka-brokers',     health: 'Critical' }, position: { x: 0,   y: 0   } }, // has L4 brokers
    { id: 's9',  projectId: 'p1', parentId: 'g4', level: 3, type: 'serviceNode', data: { label: 'zookeeper-ensemble', health: 'Warning'  }, position: { x: 200, y: 0   } },
    { id: 's10', projectId: 'p1', parentId: 'g4', level: 3, type: 'serviceNode', data: { label: 'schema-registry',    health: 'Healthy'  }, position: { x: 100, y: 100 } },

    // g5 → flink-jobs
    { id: 's11', projectId: 'p1', parentId: 'g5', level: 3, type: 'serviceNode', data: { label: 'flink-taskmanager', health: 'Warning'  }, position: { x: 0,   y: 0 } },
    { id: 's12', projectId: 'p1', parentId: 'g5', level: 3, type: 'serviceNode', data: { label: 'flink-jobmanager',  health: 'Healthy'  }, position: { x: 180, y: 0 } },

    // g6 → gateway-services
    { id: 's13', projectId: 'p1', parentId: 'g6', level: 3, type: 'serviceNode', data: { label: 'api-gateway',  health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 's14', projectId: 'p1', parentId: 'g6', level: 3, type: 'serviceNode', data: { label: 'rate-limiter', health: 'Healthy' }, position: { x: 160, y: 0 } },

    // g8 → auth-services
    { id: 's15', projectId: 'p1', parentId: 'g8', level: 3, type: 'serviceNode', data: { label: 'auth-api',       health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 's16', projectId: 'p1', parentId: 'g8', level: 3, type: 'serviceNode', data: { label: 'token-service',   health: 'Healthy' }, position: { x: 160, y: 0 } },

    // g9 → profile-services
    { id: 's17', projectId: 'p1', parentId: 'g9', level: 3, type: 'serviceNode', data: { label: 'profile-api', health: 'Healthy' }, position: { x: 0, y: 0 } },

    // g10 → notification-services
    { id: 's18', projectId: 'p1', parentId: 'g10', level: 3, type: 'serviceNode', data: { label: 'email-service',     health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 's19', projectId: 'p1', parentId: 'g10', level: 3, type: 'serviceNode', data: { label: 'push-notification', health: 'Healthy' }, position: { x: 180, y: 0 } },

    // g11 → spark-jobs
    { id: 's20', projectId: 'p1', parentId: 'g11', level: 3, type: 'serviceNode', data: { label: 'spark-driver',   health: 'Warning'  }, position: { x: 0,   y: 0 } },
    { id: 's21', projectId: 'p1', parentId: 'g11', level: 3, type: 'serviceNode', data: { label: 'spark-executor', health: 'Healthy'  }, position: { x: 160, y: 0 } },

    // g12 → data-warehouse
    { id: 's22', projectId: 'p1', parentId: 'g12', level: 3, type: 'serviceNode', data: { label: 'redshift-cluster', health: 'Healthy' }, position: { x: 0,   y: 0 } },
    { id: 's23', projectId: 'p1', parentId: 'g12', level: 3, type: 'serviceNode', data: { label: 'glue-etl',          health: 'Healthy' }, position: { x: 170, y: 0 } },

    // ── PROJECT 2: Identity & Auth ──────────────────────────────────────
    { id: 'auth-root', projectId: 'p2', level: 0, type: 'clusterNode', data: { label: 'auth-cluster', health: 'Healthy' }, position: { x: 200, y: 100 } },
    { id: 'auth-ns', projectId: 'p2', parentId: 'auth-root', level: 1, type: 'subClusterNode', data: { label: 'identity-namespace', health: 'Healthy' }, position: { x: 0, y: 0 } },
    { id: 'auth-svc', projectId: 'p2', parentId: 'auth-ns', level: 2, type: 'serviceNode', data: { label: 'login-service', health: 'Healthy' }, position: { x: 0, y: 0 } },

    // ── LEVEL 4: Pods / Instances ────────────────────────────────────────
    // s1 → payment-api pods  (Path A: c1 → sc1 → g1 → s1 → pods)
    { id: 'pod1', projectId: 'p1', parentId: 's1', level: 4, type: 'serviceNode', data: { label: 'payment-api-pod-1', health: 'Critical' }, position: { x: 0,   y: 0   } },
    { id: 'pod2', projectId: 'p1', parentId: 's1', level: 4, type: 'serviceNode', data: { label: 'payment-api-pod-2', health: 'Warning'  }, position: { x: 220, y: 0   } },
    { id: 'pod3', projectId: 'p1', parentId: 's1', level: 4, type: 'serviceNode', data: { label: 'payment-api-pod-3', health: 'Healthy'  }, position: { x: 110, y: 110 } },

    // s8 → kafka-brokers  (Path B: c3 → sc3 → g4 → s8 → brokers)
    { id: 'broker1', projectId: 'p1', parentId: 's8', level: 4, type: 'serviceNode', data: { label: 'kafka-broker-1', health: 'Critical' }, position: { x: 0,   y: 0   } },
    { id: 'broker2', projectId: 'p1', parentId: 's8', level: 4, type: 'serviceNode', data: { label: 'kafka-broker-2', health: 'Healthy'  }, position: { x: 200, y: 0   } },
    { id: 'broker3', projectId: 'p1', parentId: 's8', level: 4, type: 'serviceNode', data: { label: 'kafka-broker-3', health: 'Healthy'  }, position: { x: 400, y: 0   } },
    { id: 'zk1',     projectId: 'p1', parentId: 's8', level: 4, type: 'serviceNode', data: { label: 'zookeeper-1',    health: 'Warning'  }, position: { x: 100, y: 110 } },
    { id: 'zk2',     projectId: 'p1', parentId: 's8', level: 4, type: 'serviceNode', data: { label: 'zookeeper-2',    health: 'Healthy'  }, position: { x: 300, y: 110 } },
  ],

  edges: [
    // L0 topology
    { id: 'e-c1-c3', source: 'c1', target: 'c3', animated: true },
    { id: 'e-c2-c3', source: 'c2', target: 'c3', animated: true },

    // L1 cross-namespace flows
    { id: 'e-sc1-sc3', source: 'sc1', target: 'sc3', animated: true },
    { id: 'e-sc5-sc1', source: 'sc5', target: 'sc1', animated: true },

    // L2 group flows
    { id: 'e-g1-g4', source: 'g1', target: 'g4', animated: true, label: 'Event Stream' },
    { id: 'e-g2-g1', source: 'g2', target: 'g1', animated: true },

    // L3 service flows
    { id: 'e-s4-s1',  source: 's4',  target: 's1',  animated: true },
    { id: 'e-s1-s8',  source: 's1',  target: 's8',  animated: true, label: 'High Lag' },
    { id: 'e-s11-s8', source: 's11', target: 's8',  animated: true },

    // L4 broker flows
    { id: 'e-broker1-zk1', source: 'broker1', target: 'zk1', animated: true },
    { id: 'e-broker2-zk2', source: 'broker2', target: 'zk2', animated: true },
  ],

  incidents: [
    {
      id: 'inc-1',
      projectId: 'p1',
      serviceId: 'pod1',
      priority: 'P0',
      title: 'OOMKilled: payment-api-pod-1 crash-looping',
      provider: 'AWS',
      tool: 'Prometheus',
      status: 'To Do',
      aiRecommendation: 'Pod exceeds 512Mi memory limit. Likely leak in v2.3.1 — rolling back to v2.2.9 recommended.',
      timestamp: '3 mins ago'
    },
    {
      id: 'inc-2',
      projectId: 'p1',
      serviceId: 'broker1',
      priority: 'P0',
      title: 'Kafka Broker-1: 47 Under-replicated Partitions',
      provider: 'AWS',
      tool: 'Datadog',
      status: 'In Progress',
      aiRecommendation: 'Broker-1 lagging. Consumer group "delivery-processors" at 82k offset lag. Scale broker or rebalance partitions.',
      timestamp: '8 mins ago'
    },
    {
      id: 'inc-3',
      projectId: 'p1',
      serviceId: 's2',
      priority: 'P1',
      title: 'Payment Processor: p99 Latency > 2s',
      provider: 'AWS',
      tool: 'New Relic',
      status: 'To Do',
      aiRecommendation: 'Latency spike correlates with Kafka broker degradation. Expect self-resolution after broker-1 recovers.',
      timestamp: '12 mins ago'
    },
    {
      id: 'inc-4',
      projectId: 'p1',
      serviceId: 's11',
      priority: 'P1',
      title: 'Flink TaskManager: Checkpoint Failures (14/14)',
      provider: 'AWS',
      tool: 'Prometheus',
      status: 'In Progress',
      aiRecommendation: 'Checkpointing failing due to Kafka connectivity. Root cause is upstream broker-1 degradation.',
      timestamp: '15 mins ago'
    },
    {
      id: 'inc-5',
      projectId: 'p1',
      serviceId: 's4',
      priority: 'P2',
      title: 'Order API: 5xx Error Rate at 2.3%',
      provider: 'AWS',
      tool: 'Datadog',
      status: 'To Do',
      aiRecommendation: 'Errors originating from payment-api dependency timeouts. Upstream root cause, no direct fix needed.',
      timestamp: '20 mins ago'
    },
    {
      id: 'inc-6',
      projectId: 'p1',
      serviceId: 'pod2',
      priority: 'P1',
      title: 'payment-api-pod-2: High GC Pause (1.8s avg)',
      provider: 'AWS',
      tool: 'Prometheus',
      status: 'To Do',
      aiRecommendation: 'Elevated GC pressure consistent with pod-1 memory leak behavior. Monitor after rollback.',
      timestamp: '5 mins ago'
    },
    {
      id: 'inc-7',
      projectId: 'p1',
      serviceId: 'zk1',
      priority: 'P1',
      title: 'Zookeeper-1: Leader Election Timeout',
      provider: 'AWS',
      tool: 'Datadog',
      status: 'In Progress',
      aiRecommendation: 'ZK quorum degraded due to broker-1 instability. Zookeeper-2 is healthy and holding quorum.',
      timestamp: '10 mins ago'
    }
  ],

  investigations: [
    {
      id: 'inv-1',
      projectId: 'p1',
      priority: 'P0',
      status: 'In Progress',
      title: 'RCA: Kafka Degradation → Payment Cascade Failure',
      assignedTo: 'AI SRE Agent',
      progress: 62
    },
    {
      id: 'inv-2',
      projectId: 'p1',
      priority: 'P1',
      status: 'To Do',
      title: 'Memory Leak Investigation: payment-api v2.3.1',
      assignedTo: 'AI SRE Agent',
      progress: 15
    }
  ]
};
