/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LoginRouteImport } from './routes/login'
import { Route as MiaRouteImport } from './routes/mia'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const MiaRoute = MiaRouteImport.update({ id: '/mia', path: '/mia', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/login': typeof LoginRoute; '/mia': typeof MiaRoute }
export interface FileRoutesByTo { '/': typeof IndexRoute; '/login': typeof LoginRoute; '/mia': typeof MiaRoute }
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/login': typeof LoginRoute; '/mia': typeof MiaRoute }
export interface FileRouteTypes { fileRoutesByFullPath: FileRoutesByFullPath; fullPaths: '/' | '/login' | '/mia'; fileRoutesByTo: FileRoutesByTo; to: '/' | '/login' | '/mia'; id: '__root__' | '/' | '/login' | '/mia'; fileRoutesById: FileRoutesById }
export interface RootRouteChildren { IndexRoute: typeof IndexRoute; LoginRoute: typeof LoginRoute; MiaRoute: typeof MiaRoute }

declare module '@tanstack/react-router' { interface FileRoutesByPath { '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }; '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }; '/mia': { id: '/mia'; path: '/mia'; fullPath: '/mia'; preLoaderRoute: typeof MiaRouteImport; parentRoute: typeof rootRouteImport } } }

const rootRouteChildren: RootRouteChildren = { IndexRoute, LoginRoute, MiaRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> } }
