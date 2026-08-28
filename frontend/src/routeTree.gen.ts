/* eslint-disable */
// @ts-nocheck
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LoginRouteImport } from './routes/login'
import { Route as MiaRouteImport } from './routes/mia'
import { Route as HojeRouteImport } from './routes/hoje'
import { Route as BibliotecaRouteImport } from './routes/biblioteca'
import { Route as FlashcardsRouteImport } from './routes/flashcards'
import { Route as DropsRouteImport } from './routes/drops'
import { Route as ProgressoRouteImport } from './routes/progresso'
import { Route as OnboardingRouteImport } from './routes/onboarding'
import { Route as PerfilRouteImport } from './routes/perfil'
import { Route as MasterRouteImport } from './routes/master'
import { Route as EscolaRouteImport } from './routes/escola'
import { Route as ProfessorRouteImport } from './routes/professor'
import { Route as CreatorRouteImport } from './routes/creator'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const MiaRoute = MiaRouteImport.update({ id: '/mia', path: '/mia', getParentRoute: () => rootRouteImport } as any)
const HojeRoute = HojeRouteImport.update({ id: '/hoje', path: '/hoje', getParentRoute: () => rootRouteImport } as any)
const BibliotecaRoute = BibliotecaRouteImport.update({ id: '/biblioteca', path: '/biblioteca', getParentRoute: () => rootRouteImport } as any)
const FlashcardsRoute = FlashcardsRouteImport.update({ id: '/flashcards', path: '/flashcards', getParentRoute: () => rootRouteImport } as any)
const DropsRoute = DropsRouteImport.update({ id: '/drops', path: '/drops', getParentRoute: () => rootRouteImport } as any)
const ProgressoRoute = ProgressoRouteImport.update({ id: '/progresso', path: '/progresso', getParentRoute: () => rootRouteImport } as any)
const OnboardingRoute = OnboardingRouteImport.update({ id: '/onboarding', path: '/onboarding', getParentRoute: () => rootRouteImport } as any)
const PerfilRoute = PerfilRouteImport.update({ id: '/perfil', path: '/perfil', getParentRoute: () => rootRouteImport } as any)
const MasterRoute = MasterRouteImport.update({ id: '/master', path: '/master', getParentRoute: () => rootRouteImport } as any)
const EscolaRoute = EscolaRouteImport.update({ id: '/escola', path: '/escola', getParentRoute: () => rootRouteImport } as any)
const ProfessorRoute = ProfessorRouteImport.update({ id: '/professor', path: '/professor', getParentRoute: () => rootRouteImport } as any)
const CreatorRoute = CreatorRouteImport.update({ id: '/creator', path: '/creator', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath { '/': typeof IndexRoute; '/login': typeof LoginRoute; '/mia': typeof MiaRoute; '/hoje': typeof HojeRoute; '/biblioteca': typeof BibliotecaRoute; '/flashcards': typeof FlashcardsRoute; '/drops': typeof DropsRoute; '/progresso': typeof ProgressoRoute; '/onboarding': typeof OnboardingRoute; '/perfil': typeof PerfilRoute; '/master': typeof MasterRoute; '/escola': typeof EscolaRoute; '/professor': typeof ProfessorRoute; '/creator': typeof CreatorRoute }
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById { __root__: typeof rootRouteImport; '/': typeof IndexRoute; '/login': typeof LoginRoute; '/mia': typeof MiaRoute; '/hoje': typeof HojeRoute; '/biblioteca': typeof BibliotecaRoute; '/flashcards': typeof FlashcardsRoute; '/drops': typeof DropsRoute; '/progresso': typeof ProgressoRoute; '/onboarding': typeof OnboardingRoute; '/perfil': typeof PerfilRoute; '/master': typeof MasterRoute; '/escola': typeof EscolaRoute; '/professor': typeof ProfessorRoute; '/creator': typeof CreatorRoute }
export interface FileRouteTypes { fileRoutesByFullPath: FileRoutesByFullPath; fullPaths: keyof FileRoutesByFullPath; fileRoutesByTo: FileRoutesByTo; to: keyof FileRoutesByFullPath; id: keyof FileRoutesById; fileRoutesById: FileRoutesById }
export interface RootRouteChildren { IndexRoute: typeof IndexRoute; LoginRoute: typeof LoginRoute; MiaRoute: typeof MiaRoute; HojeRoute: typeof HojeRoute; BibliotecaRoute: typeof BibliotecaRoute; FlashcardsRoute: typeof FlashcardsRoute; DropsRoute: typeof DropsRoute; ProgressoRoute: typeof ProgressoRoute; OnboardingRoute: typeof OnboardingRoute; PerfilRoute: typeof PerfilRoute; MasterRoute: typeof MasterRoute; EscolaRoute: typeof EscolaRoute; ProfessorRoute: typeof ProfessorRoute; CreatorRoute: typeof CreatorRoute }
const rootRouteChildren: RootRouteChildren = { IndexRoute, LoginRoute, MiaRoute, HojeRoute, BibliotecaRoute, FlashcardsRoute, DropsRoute, ProgressoRoute, OnboardingRoute, PerfilRoute, MasterRoute, EscolaRoute, ProfessorRoute, CreatorRoute }
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' { interface Register { ssr: true; router: Awaited<ReturnType<typeof getRouter>>; config: Awaited<ReturnType<typeof startInstance.getOptions>> } }