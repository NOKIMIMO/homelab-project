plugins {
    kotlin("jvm")
    `maven-publish`
}

group = "com.homelab"
version = "0.0.4"

repositories {
    mavenCentral()
}

dependencies {
    testImplementation(kotlin("test"))
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:2.15.2")

}

publishing {
    publications {
        create("mavenJava", MavenPublication::class) {
            from(components["kotlin"])
            groupId = project.group.toString()
            artifactId = project.name
            version = project.version.toString()

            pom {
                name.set("homelab-sdk")
                description.set("Homelab SDK interfaces for plugin development")
                url.set("https://github.com/NOKIMIMO/homelab-project")
            }
        }
    }

    repositories {
        maven {
            name = "GitHubPackages"
            url = uri("https://maven.pkg.github.com/NOKIMIMO/homelab-project")
            credentials {
                username = providers.gradleProperty("gpr.user")
                    .orElse(providers.environmentVariable("GITHUB_ACTOR")).orNull
                password = providers.gradleProperty("gpr.token")
                    .orElse(providers.environmentVariable("GITHUB_TOKEN")).orNull
            }
        }
    }
}

tasks.register("publishLocal") {
    dependsOn("publishToMavenLocal")
}

tasks.register("publishGithub") {
    dependsOn("publishMavenJavaPublicationToGitHubPackagesRepository")
}

kotlin {
    jvmToolchain(21)
}

tasks.test {
    useJUnitPlatform()
}