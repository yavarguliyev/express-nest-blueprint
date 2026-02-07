import jenkins.model.*
import hudson.model.*
import org.jenkinsci.plugins.workflow.job.WorkflowJob
import org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition
import com.cloudbees.hudson.plugins.folder.Folder

def jenkins = Jenkins.instance
println "--- Jenkins Init: Starting automated job creation ---"

try {
    // 1. Create deployments folder
    println "Checking for folder: deployments"
    def folder = jenkins.getItem('deployments')
    if (folder == null) {
        println "Creating folder: deployments"
        folder = jenkins.createProject(Folder, 'deployments')
    }
    folder.setDisplayName('Environment Deployments')
    folder.setDescription('Automated deployment jobs for dev, prod, and infra environments')
    folder.save()

    // 2. Dev deployment job
    println "Checking for job: dev-deployment"
    def devJob = folder.getItem('dev-deployment')
    if (devJob == null) {
        println "Creating job: dev-deployment"
        devJob = folder.createProject(WorkflowJob, 'dev-deployment')
    }
    devJob.setDisplayName('🚀 Dev Environment')
    devJob.setDescription('Deploy to development environment. Access Admin UI at http://localhost:3000/admin and API at http://localhost:3000')
    def devScript = '''
pipeline {
    agent any
    parameters {
        choice(name: 'ACTION', choices: ['deploy', 'restart', 'stop', 'remove'], description: 'Select action to perform')
    }
    stages {
        stage('Execute') {
            steps {
                script {
                    def scriptName = params.ACTION == 'deploy' ? 'start.sh' : "${params.ACTION}.sh"
                    dir('/var/jenkins_home/workspace/project/packages/infrastructure/deployments/dev') {
                        sh "chmod +x ${scriptName}"
                        def forceFlag = (params.ACTION == 'remove') ? ' --force' : ''
                        sh "bash ${scriptName}${forceFlag}"
                    }
                }
            }
        }
    }
    post {
        success {
            echo "✅ Dev environment ${params.ACTION} completed successfully!"
            script {
                if (params.ACTION == 'deploy') {
                    echo "🌐 Admin UI:   http://localhost:3000/admin"
                    echo "🔌 API:        http://localhost:3000/api/v1"
                    echo "📊 Prometheus: http://localhost:9090"
                    echo "📈 Grafana:    http://localhost:3001 (admin/admin)"
                    echo "💾 MinIO:      http://localhost:9001 (minioadmin/minioadmin)"
                }
            }
        }
        failure {
            echo "❌ Dev environment ${params.ACTION} failed!"
        }
    }
}
'''
    devJob.setDefinition(new CpsFlowDefinition(devScript, true))
    devJob.save()

    // 3. Prod deployment job
    println "Checking for job: prod-deployment"
    def prodJob = folder.getItem('prod-deployment')
    if (prodJob == null) {
        println "Creating job: prod-deployment"
        prodJob = folder.createProject(WorkflowJob, 'prod-deployment')
    }
    prodJob.setDisplayName('🏭 Prod Environment')
    prodJob.setDescription('Deploy to production environment. Access via Nginx on http://localhost:80')
    def prodScript = '''
pipeline {
    agent any
    parameters {
        choice(name: 'ACTION', choices: ['deploy', 'restart', 'stop', 'remove'], description: 'Select action to perform')
    }
    stages {
        stage('Execute') {
            steps {
                script {
                    def scriptName = params.ACTION == 'deploy' ? 'start.sh' : "${params.ACTION}.sh"
                    dir('/var/jenkins_home/workspace/project/packages/infrastructure/deployments/prod') {
                        sh "chmod +x ${scriptName}"
                        def forceFlag = (params.ACTION == 'remove') ? ' --force' : ''
                        sh "bash ${scriptName}${forceFlag}"
                    }
                }
            }
        }
    }
    post {
        success {
            echo "✅ Prod environment ${params.ACTION} completed successfully!"
            script {
                if (params.ACTION == 'deploy') {
                    echo "🌐 Admin UI:   http://localhost:80"
                    echo "🔌 API:        http://localhost:3000/api/v1"
                    echo "📊 Prometheus: http://localhost:9090"
                    echo "📈 Grafana:    http://localhost:3001 (admin/admin)"
                    echo "💾 MinIO:      http://localhost:9001 (minioadmin/minioadmin)"
                }
            }
        }
        failure {
            echo "❌ Prod environment ${params.ACTION} failed!"
        }
    }
}
'''
    prodJob.setDefinition(new CpsFlowDefinition(prodScript, true))
    prodJob.save()

    // 4. Infra deployment job
    println "Checking for job: infra-deployment"
    def infraJob = folder.getItem('infra-deployment')
    if (infraJob == null) {
        println "Creating job: infra-deployment"
        infraJob = folder.createProject(WorkflowJob, 'infra-deployment')
    }
    infraJob.setDisplayName('🏗️ Infrastructure (K8s)')
    infraJob.setDescription('Deploy local Kubernetes infrastructure. Access via http://api.local')
    def infraScript = '''
pipeline {
    agent any
    parameters {
        choice(name: 'ACTION', choices: ['deploy', 'restart', 'stop', 'remove'], description: 'Select action to perform')
    }
    stages {
        stage('Execute') {
            steps {
                script {
                    def scriptName = params.ACTION
                    if (params.ACTION == 'deploy') {
                        scriptName = 'deploy.sh'
                    } else if (params.ACTION == 'remove') {
                        scriptName = 'clean.sh'
                    } else {
                        scriptName = "${params.ACTION}.sh"
                    }
                    dir('/var/jenkins_home/workspace/project/packages/infrastructure/deployments/infra/scripts') {
                        sh "chmod +x ${scriptName}"
                        def forceFlag = (params.ACTION == 'remove') ? ' --force' : ''
                        sh "bash ${scriptName}${forceFlag}"
                    }
                }
            }
        }
    }
    post {
        success {
            echo "✅ Infrastructure ${params.ACTION} completed successfully!"
            script {
                if (params.ACTION == 'deploy') {
                    echo "🌐 API & Admin (K8s): http://api.local"
                    echo "📊 Grafana (K8s): http://grafana.local"
                    echo "📈 Prometheus (K8s): http://prometheus.local"
                    echo "💾 MinIO Console (K8s): http://minio.local (minioadmin/minioadmin)"
                }
            }
        }
        failure {
            echo "❌ Infrastructure ${params.ACTION} failed!"
        }
    }
}
'''
    infraJob.setDefinition(new CpsFlowDefinition(infraScript, true))
    infraJob.save()

    println "✅ Successfully created all deployment jobs!"
} catch (Exception e) {
    println "❌ Error creating deployment jobs: ${e.message}"
    e.printStackTrace()
}

println "--- Jenkins Init: Automated job creation finished ---"
