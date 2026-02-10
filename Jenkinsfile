pipeline {
    agent any

    triggers {
        githubPush()
    }

    stages {
        stage('Run Ansible Deployment') {
            steps {
                script {
                    sh """
                    cd /opt/ansible/furniture-backend
                    ansible-playbook -i inventory.ini furniture-backend.yaml
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Deployment completed successfully!"
        }
        failure {
            echo "❌ Deployment failed. Check Jenkins console output."
        }
    }
}
