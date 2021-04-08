# API

## Информация

Сервис предоставляет API, который настраивается в секции файла настройки **api**. API доступно по протоколу HTTP.

### Примеры применения

проверить доступность сервера: `curl -i http://localhost:3001/api/healthcheck` или `curl -i http://localhost:3001/api/`  

### API информации сервиса

| URL | Метод | Код | Описание | Пример ответа/запроса |
| ----- | ----- | ----- | ----- | ----- |
| / | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck | GET | 200 | проверить здоровье сервиса | OK |
| /healthcheck/status | GET | 200 | получить статус здоровья | [пример](#v1_status) |
| /v1/packages | GET | 200 | получить список пакетов | [пример](#v1_packages) |
| /v1/package/${id} | GET | 200 | получить информацию о пакете по ключу | [пример](#v1_packages_id) |
| /v1/package/${id}/version/${version} | GET | 200 | получить версию по ключу | [пример](#v1_packages_id_version) |
| /v1/package/${id}/version/${version}?raw=true | GET | 200 | получить версию raw по ключу | [пример](#v1_packages_id_version_raw) |

## Примеры ответов/запросов

### Базовый ответ провала

Этот ответ возвращается при отказе выполнения запроса. Пример:

```js
{
    "status": "fail",
    "message": "Причина отказа"
}
```

### Базовый ответ ошибки

Этот ответ возвращается при ошибке на сервере. Пример:

```js
{
    "status": "error",
    "message": "Причина ошибки"
}
```

### <a name="v1_status"></a> Получить статус здоровья: /healthcheck/status

**Тело ответа**
```js
{
    "Healthy": false,
    "Status": "Unhealthy",
    "Uptime": 4,
    "Human_uptime": "4s",
    "Entries": {}
}
```

### <a name="v1_packages"></a> Получить список пакетов: /v1/packages

```js
{
    "status": "success",
    "data": [
        "monitoring"
    ]
}
```

### <a name="v1_packages_id"></a> Получить информацию о пакеие по ключу: /v1/package/${id}

```js
{
    "status": "success",
    "data": {
        "id": "monitoring",
        "list": [
            "1.0.0",
            "latest",
            "1.0.1",
            "1.0.2",
            "1.0.3"
        ]
    }
}
```

### <a name="v1_packages_id_version"></a> Получить версию по ключу: /v1/package/${id}/version/${version}

```js
{
    "status": "success",
    "data": "version: \"3.9\"\nx-package:\n    version: \"1.0.0\"\n    generation: \"v1\"\n    deploy:\n        type: \"manual\"\n        force-recreate: false\nservices:\n    grafana: \n        image: grafana/grafana:7.4.3\n        container_name: grafana\n        hostname: grafana\n        ports:\n            - \"3000:3000\"\n        deploy:\n            replicas: 1\n        networks:\n            - harvester\n        logging:\n            driver: \"json-file\"\n            options:\n                max-size: \"200k\"\n                max-file: \"2\"\n    loki: \n        image: grafana/loki:2.2.0\n        container_name: loki\n        hostname: loki\n        ports:\n            - \"3100:3100\"\n        deploy:\n            replicas: 1\n        networks:\n            - harvester\n        logging:\n            driver: \"json-file\"\n            options:\n                max-size: \"200k\"\n                max-file: \"2\"\n    rabbitmq: \n        image: rabbitmq:3.8-management\n        container_name: rabbitmq\n        hostname: rabbitmq\n        ports:\n            - \"5672:5672\"\n            - \"15672:15672\"\n        deploy:\n            replicas: 1\n        environment:\n            RABBITMQ_DEFAULT_USER: \"root\"\n            RABBITMQ_DEFAULT_PASS: \"password\"\n        networks:\n            - harvester\n        logging:\n            driver: \"json-file\"\n            options:\n                max-size: \"200k\"\n                max-file: \"2\"\nnetworks:\n  harvester:\n    external: false\n    driver: bridge\n    name: harvester"
}
```

### <a name="v1_packages_id_version_raw"></a> Получить версию raw по ключу: /v1/package/${id}/version/${version}?raw=true

```yaml
version: "3.9"
x-package:
    version: "1.0.0"
    generation: "v1"
    deploy:
        type: "manual"
        force-recreate: false
services:
    grafana: 
        image: grafana/grafana:7.4.3
        container_name: grafana
        hostname: grafana
        ports:
            - "3000:3000"
        deploy:
            replicas: 1
        networks:
            - harvester
        logging:
            driver: "json-file"
            options:
                max-size: "200k"
                max-file: "2"
    loki: 
        image: grafana/loki:2.2.0
        container_name: loki
        hostname: loki
        ports:
            - "3100:3100"
        deploy:
            replicas: 1
        networks:
            - harvester
        logging:
            driver: "json-file"
            options:
                max-size: "200k"
                max-file: "2"
    rabbitmq: 
        image: rabbitmq:3.8-management
        container_name: rabbitmq
        hostname: rabbitmq
        ports:
            - "5672:5672"
            - "15672:15672"
        deploy:
            replicas: 1
        environment:
            RABBITMQ_DEFAULT_USER: "root"
            RABBITMQ_DEFAULT_PASS: "password"
        networks:
            - harvester
        logging:
            driver: "json-file"
            options:
                max-size: "200k"
                max-file: "2"
networks:
  harvester:
    external: false
    driver: bridge
    name: harvester
```
