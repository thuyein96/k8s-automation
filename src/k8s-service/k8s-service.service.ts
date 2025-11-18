import { BadRequestException, Injectable } from '@nestjs/common';
// import * as k8s from '@kubernetes/client-node';

@Injectable()
export class KubernetesService {
  private k8sApi: any;
  private k8sCoreV1Api: any;
  private k8sNetworkingApi: any;

  async initializeK8sClient(): Promise<void> {
    const k8s = await import('@kubernetes/client-node');
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    // const configString = process.env.KUBECONFIG_CONTENT;
    // kc.loadFromString(configString);
    this.k8sApi = kc.makeApiClient(k8s.AppsV1Api);
  }

  async initializeK8sCoreV1Client(): Promise<void> {
    const k8s = await import('@kubernetes/client-node');
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    // const configString = process.env.KUBECONFIG_CONTENT;
    // kc.loadFromString(configString);
    this.k8sCoreV1Api = kc.makeApiClient(k8s.CoreV1Api);
  }

  async initializeK8sNetworkingClient(): Promise<void> {
    const k8s = await import('@kubernetes/client-node');
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    // const configString = process.env.KUBECONFIG_CONTENT;
    // kc.loadFromString(configString);
    this.k8sNetworkingApi = kc.makeApiClient(k8s.NetworkingV1Api);
  }

  // constructor() {
  // }

  async createDeployment({
    name,
    image,
    usePrivateRegistry,
  }: {
    name: string;
    image: string;
    usePrivateRegistry: boolean;
  }): Promise<any> {
    if (!this.k8sApi) {
      await this.initializeK8sClient();
    }

    const deployment = {
      metadata: {
        name: `${name}`,
      },
      spec: {
        selector: {
          matchLabels: {
            app: `${name}`,
          },
        },
        replicas: 1,
        template: {
          metadata: {
            labels: {
              app: `${name}`,
            },
          },
          spec: {
            containers: [
              {
                name: `${name}`,
                image: `${image}`,
              },
            ],
            ...(usePrivateRegistry && {
              imagePullSecrets: [
                {
                  name: 'regcred', // Name of your Docker registry secret
                },
              ],
            }),
          },
        },
      },
    };

    try {
      const response = await this.k8sApi.createNamespacedDeployment({
        namespace: 'default',
        body: deployment,
      });
      console.log('Yay! \nYou spawned: ' + deployment.metadata.name);
      console.log(response);
      return {
        success: true,
        message: 'K8s Deployment created successfully 🎉',
      };
    } catch (error) {
      console.error('Error creating deployment:', error);
      return {
        success: false,
        message: `Failed to create K8s Deployment: ${error}`,
      };
    }
  }

  async createService({
    name,
    port,
  }: {
    name: string;
    port: number;
  }): Promise<any> {
    if (!this.k8sCoreV1Api) {
      await this.initializeK8sCoreV1Client();
    }

    const service = {
      metadata: {
        name: `${name}`,
      },
      spec: {
        selector: {
          app: `${name}`,
        },
        ports: [
          {
            protocol: 'TCP',
            port: 80,
            targetPort: Number(port),
          },
        ],
        type: 'ClusterIP',
      },
    };

    try {
      const response = await this.k8sCoreV1Api.createNamespacedService({
        namespace: 'default',
        body: service,
      });
      console.log('Yay! \nYou spawned: ' + service.metadata.name);
      console.log(response);
      return { success: true, message: 'K8s Service created successfully 🎉' };
    } catch (error) {
      console.error('Error creating service:', error);
      return {
        success: false,
        message: `Failed to create K8s Service: ${error}`,
      };
    }
  }

  async createIngress({
    name,
    host,
  }: {
    name: string;
    host: string;
  }): Promise<any> {
    if (!this.k8sNetworkingApi) {
      await this.initializeK8sNetworkingClient();
    }

    try {
      await this.k8sNetworkingApi.createNamespacedIngress({
        namespace: 'default',
        body: {
          apiVersion: 'networking.k8s.io/v1',
          kind: 'Ingress',
          metadata: { name: `${name}` },
          spec: {
            rules: [
              {
                host: `${host}.life-au.live`,
                http: {
                  paths: [
                    {
                      backend: {
                        service: {
                          name: `${name}`,
                          port: { number: 80 },
                        },
                      },
                      path: '/',
                      pathType: 'Prefix',
                    },
                  ],
                },
              },
            ],
            ingressClassName: 'nginx',
          },
          // status: {
          //   loadBalancer: {
          //     ingress: [{ ip: '134.33.172.14' }],
          //   },
          // },
        },
      });

      return { success: true, message: 'K8s Ingress created successfully 🎉' };
    } catch (e) {
      console.error('Error creating ingress:', e);
      return { success: false, message: `Failed to create K8s Ingress: ${e}` };
    }
  }

  async deleteK8sResources({ name }: { name: string }): Promise<any> {
    console.log('Deleting resources:', name);
    if (!this.k8sApi) {
      await this.initializeK8sClient();
    }
    if (!this.k8sCoreV1Api) {
      await this.initializeK8sCoreV1Client();
    }
    if (!this.k8sNetworkingApi) {
      await this.initializeK8sNetworkingClient();
    }

    try {
      const downDeployment = await this.k8sApi.deleteNamespacedDeployment({ name: `${name}`, namespace: 'default' });
      console.log('Deleted Deployment:', downDeployment);
      const deleteService = await this.k8sCoreV1Api.deleteNamespacedService({ name: `${name}`, namespace: 'default' });
      console.log('Deleted Service:', deleteService);
      const deleteIngress = await this.k8sNetworkingApi.deleteNamespacedIngress({ name: `${name}`, namespace: 'default' });
      console.log('Deleted Ingress:', deleteIngress);

      return 'K8s resources deleted successfully 🎉'
    } catch (e) {
      console.error('Error deleting resources:', e);
      throw new BadRequestException(`Failed to delete K8s resources: ${e}`)
    }

  }

  async getDeployments(): Promise<any> {
    if (!this.k8sApi) {
      await this.initializeK8sClient();
    }

    try {
      const response = await this.k8sApi.listNamespacedDeployment({ namespace: 'default' });
      return response.items;
    } catch (e) {
      console.error('Error getting deployments:', e);
      return [];
    }
  }

  async getServices(): Promise<any> {
    if (!this.k8sCoreV1Api) {
      await this.initializeK8sCoreV1Client();
    }

    try {
      const response = await this.k8sCoreV1Api.listNamespacedService({ namespace: 'default' });
      return response.items;
    } catch (e) {
      console.error('Error getting services:', e);
      return [];
    }
  }

  async getIngresses(): Promise<any> {
    if (!this.k8sNetworkingApi) {
      await this.initializeK8sNetworkingClient();
    }

    try {
      const response = await this.k8sNetworkingApi.listNamespacedIngress({ namespace: 'default' });
      return response.items;
    } catch (e) {
      console.error('Error getting ingress:', e);
      return [];
    }
  }

  async getPods(): Promise<any> {
    if (!this.k8sCoreV1Api) {
      await this.initializeK8sCoreV1Client();
    }

    try {
      const response = await this.k8sCoreV1Api.listNamespacedPod({ namespace: 'default' });
      return response.items;
    } catch (e) {
      console.error('Error getting pods:', e);
      return [];
    }
  }

}
