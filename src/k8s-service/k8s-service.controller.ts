import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Delete,
  Get,
} from '@nestjs/common';
import { KubernetesService } from './k8s-service.service';

@Controller('')
export class KubernetesController {
  constructor(private readonly kubernetesService: KubernetesService) {}

  @Post('initialize')
  async initializeK8s(
    @Body()
    { name, image, port, usePrivateRegistry }: { name: string; image: string; port: number; usePrivateRegistry: boolean },
  ): Promise<any> {
    if (name === undefined || image === undefined || port === undefined || usePrivateRegistry === undefined)
      throw new BadRequestException('Invalid Request, Parameters missing');

    const deployment = await this.kubernetesService.createDeployment({
      name: name,
      image: image,
      usePrivateRegistry,
    });
    console.log(deployment);
    if (!deployment.success) throw new BadRequestException(deployment.message);

    const service = await this.kubernetesService.createService({
      name: name,
      port: port,
    });
    console.log(service);
    if (!service.success) throw new BadRequestException(service.message);

    const ingress = await this.kubernetesService.createIngress({
      name: name,
      host: name,
    });
    console.log(ingress);
    if (!ingress.success) throw new BadRequestException(ingress.message);

    return {
      success: true,
      message: `Kubernetes Deployment Successfull! \n🚀 App link => http://${name}.life-au.live`,
    };
  }

  @Post('create-deployment')
  async createDeployment(
    @Body() { name, image, usePrivateRegistry }: { name: string; image: string; usePrivateRegistry: boolean },
  ) {
    try {
      const result = await this.kubernetesService.createDeployment({
        name: name,
        image: image,
        usePrivateRegistry,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Post('create-service')
  async createService(@Body() { name, port }: { name: string; port: number }) {
    try {
      const result = await this.kubernetesService.createService({
        name: name,
        port: port,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Post('create-ingress')
  async createIngress(@Body() { name, host }: { name: string; host: string }) {
    try {
      const result = await this.kubernetesService.createIngress({
        name: name,
        host: host,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Delete('down')
  async downK8s(@Body() { name }: { name: string }): Promise<any> {
    try {
      const result = await this.kubernetesService.deleteK8sResources({
        name: name,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('deployments')
  async getDeployments(): Promise<any> {
    try {
      const result = await this.kubernetesService.getDeployments();
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Get('services')
  async getServices(): Promise<any> {
    try {
      const result = await this.kubernetesService.getServices();
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Get('ingresses')
  async getIngresses(): Promise<any> {
    try {
      const result = await this.kubernetesService.getIngresses();
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Get('pods')
  async getPods(): Promise<any> {
    try {
      const result = await this.kubernetesService.getPods();
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
}
