---
slug: deploying-with-kubernetes-helm-charts
title: Kubernetes Deployment
description: How to deploy Domain Locker using Kubernetes and Helm charts
coverImage: 
index: 2
---


> [!NOTE]
> This is not officially supported. These helm charts are for reference only. I cannot guarantee k8 support if something does not work as expected, but feel free to submit a pull request


## Installation Prerequisites


### Install `kubctl`

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

For instructions for your OS, see the [kubernetes docs](https://kubernetes.io/docs/tasks/tools/)

### Install `minikube`

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb
```

For instructions for your OS, see the [minikube docs](https://minikube.sigs.k8s.io/docs/start)

### Install `helm`

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

For instructions for your OS, see the [helm docs](https://helm.sh/docs/intro/install/)

---

## Start the app


### Start Kubernetes

```bash
minikube start
```

This will start a local single-node Kubernetes cluster, add `--driver=docker` for using Docker.

### Spin up domain-locker helm charts

```bash
helm install dl ./helm --wait
```

### Verify it's running

```bash
kubectl get all
```

### Port forward to access

```bash
kubectl port-forward svc/domain-locker-app 3000:80
```

### Launch the app

You should now be able to access Domain Locker at `localhost:3000` 🎉

---


## Debug


You can check the app is running with:

```bash
kubectl get pods
kubectl get svc
```

And view the logs with:

```bash
kubectl logs deploy/domain-locker-app
```

Or open a debug shell with:

```bash
kubectl exec -it deploy/domain-locker-app -- sh
```

Manually connect to the database:

```bash
psql -h domain-locker-postgres -U postgres -d domain_locker
```
