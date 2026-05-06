import type { IDesign } from "@designcombo/types";

export interface EditorProject {
	id: string;
	name: string;
	design: IDesign;
	createdAt: string;
	updatedAt: string;
}

export type ProjectPatch = Partial<Pick<EditorProject, "name" | "design">>;

const STORAGE_KEY = "web-editor.projects.v1";
const DEFAULT_PROJECT_NAME = "Untitled video";

export const createEmptyDesign = (id: string): IDesign => ({
	id,
	fps: 30,
	size: {
		width: 1080,
		height: 1920,
	},
	tracks: [],
	trackItemIds: [],
	transitionIds: [],
	transitionsMap: {},
	trackItemsMap: {},
	structure: [],
	background: {
		type: "color",
		value: "transparent",
	},
});

const isBrowser = () => typeof window !== "undefined";

const createProjectId = () => {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}

	return `project-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readProjects = (): EditorProject[] => {
	if (!isBrowser()) return [];

	try {
		const rawProjects = window.localStorage.getItem(STORAGE_KEY);
		if (!rawProjects) return [];

		const parsedProjects = JSON.parse(rawProjects);
		if (!Array.isArray(parsedProjects)) return [];

		return parsedProjects.filter(isEditorProject);
	} catch (error) {
		console.error("Failed to read saved editor projects", error);
		return [];
	}
};

const writeProjects = (projects: EditorProject[]) => {
	if (!isBrowser()) return;

	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
	} catch (error) {
		console.error("Failed to save editor projects", error);
	}
};

const isEditorProject = (project: unknown): project is EditorProject => {
	if (!project || typeof project !== "object") return false;

	const candidate = project as Partial<EditorProject>;

	return (
		typeof candidate.id === "string" &&
		typeof candidate.name === "string" &&
		typeof candidate.createdAt === "string" &&
		typeof candidate.updatedAt === "string" &&
		Boolean(candidate.design) &&
		typeof candidate.design === "object"
	);
};

export const projectRepository = {
	createProject: ({
		name = DEFAULT_PROJECT_NAME,
		design,
	}: {
		name?: string;
		design?: IDesign;
	} = {}) => {
		const now = new Date().toISOString();
		const id = createProjectId();
		const project: EditorProject = {
			id,
			name: name.trim() || DEFAULT_PROJECT_NAME,
			design: design ? { ...design, id } : createEmptyDesign(id),
			createdAt: now,
			updatedAt: now,
		};

		writeProjects([project, ...readProjects()]);

		return project;
	},

	getProject: (id: string) => {
		return readProjects().find((project) => project.id === id) ?? null;
	},

	updateProject: (id: string, patch: ProjectPatch) => {
		const projects = readProjects();
		const projectIndex = projects.findIndex((project) => project.id === id);

		if (projectIndex === -1) return null;

		const updatedProject: EditorProject = {
			...projects[projectIndex],
			...patch,
			name:
				typeof patch.name === "string"
					? patch.name.trim() || DEFAULT_PROJECT_NAME
					: projects[projectIndex].name,
			updatedAt: new Date().toISOString(),
		};

		projects[projectIndex] = updatedProject;
		writeProjects(projects);

		return updatedProject;
	},

	listProjects: () => {
		return readProjects().sort(
			(a, b) =>
				new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
		);
	},
};

export { DEFAULT_PROJECT_NAME };
