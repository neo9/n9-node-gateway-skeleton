
export interface ServerApi {
	name: string;
	context: string;
	target: string;
	options: {
		pathRewrite: any;
		changeOrigin: boolean;
	};
	ignoreRoutes: boolean;
}
