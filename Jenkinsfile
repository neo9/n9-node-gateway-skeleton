library('pipeline')_

DockerPipeline {
  imageName = "routing-controllers-starter"
	project = "project-name"
	tests = ["yarn test"]
	deployment = true
	deployBranches = ['master', 'develop']
	notifications = [email: 'pim@neo9.fr', slack: 'pim']
}
