library('pipeline')_

DockerPipeline {
	imageName = "gateway-skeleton"
	project = "project"
	tests = ["yarn test"]
	dockerRequirements = [
	'mongo:3.6-jessie': [
			host: 'mongodb',
			port: 27017
		]
	]
	deployment = true
	deployBranches = ['master', 'develop']
	notifications = [email: 'alert@test.com', slack: 'slack-chn']
}
