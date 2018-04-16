library('pipeline')_

DockerPipeline {
	imageName = "web-api"
	project = "pim"
	tests = ["yarn test"]
	dockerRequirements = [
	'mongo:3.6-jessie': [
			host: 'mongodb',
			port: 27017
		]
	]
	deployment = true
	deployBranches = ['master', 'develop']
	notifications = [email: 'pim@neo9.fr', slack: 'pim']
}
