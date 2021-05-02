export interface ICatalogNodeJson {
    id: string
    list: string[]
}

export interface ICatalogNode {
    readonly id: string
    readonly json: ICatalogNodeJson
    readonly versions: string[]
    addPackage: (version: string, package_path: string) => void
    getPackage: (version: string) => Promise<string>
    existPackage: (version: string) => boolean
}

export interface ICatalog {
    readonly nodes: string[]
    run: () => Promise<void>
    stop: () => Promise<void>
    existNode: (id_node: string) => boolean
    getNode: (id_node: string) => ICatalogNode
}

export interface IPackage {
    version: string
    "x-package": {
        version: string
        timestamp: number
        deploy: {
            type: string
            "force-recreate": boolean
            rollback: boolean
        }
    }
    services: {
        [key: string]: {
            image: string
            container_name?: string
            hostname?: string
            "x-healthcheck"?: IHealthcheckConfig
        }
    }
        
}

export interface IHealthcheckConfig {
    type: string
}

export interface ICatalogConfig {
    path: string
    update_interval: number
    subtree_package: boolean
}