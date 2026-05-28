plugins {
    kotlin("jvm")
    `maven-publish`
}

group = "com.homelab"
version = "0.0.2"

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
                url.set("https://example.local/homelab-sdk")
            }
        }
    }
}

tasks.register("publishLocal") {
    dependsOn("publishToMavenLocal")
}

kotlin {
    jvmToolchain(21)
}

tasks.test {
    useJUnitPlatform()
}