plugins {
    kotlin("jvm") version "2.1.21"
    kotlin("plugin.spring") version "2.1.21"
    id("org.jetbrains.kotlin.plugin.jpa") version "2.1.21"
    id("org.springframework.boot") version "3.5.16"
    id("io.spring.dependency-management") version "1.1.6"
    id("org.jetbrains.kotlinx.kover") version "0.9.1"
}

group = "com.homelab"
version = "0.0.2"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

kotlin {
	jvmToolchain(21)
}

repositories { mavenCentral() }

dependencies {
    // version checker
    implementation("com.vdurmont:semver4j:3.1.0")
    implementation("org.springframework.boot:spring-boot-starter")
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.postgresql:postgresql")
    implementation("com.github.oshi:oshi-core:6.6.2")
    implementation("org.jetbrains.kotlin:kotlin-reflect")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation(project(":homelab-sdk"))
    implementation("io.jsonwebtoken:jjwt-api:0.12.6")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    runtimeOnly("io.jsonwebtoken:jjwt-impl:0.12.6")
    runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.12.6")
    compileOnly("org.projectlombok:lombok")
    developmentOnly("org.springframework.boot:spring-boot-devtools")
    annotationProcessor("org.projectlombok:lombok")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.4.0")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
    testImplementation(kotlin("test"))
}

kotlin {
    jvmToolchain(21)
    compilerOptions {
        freeCompilerArgs.add("-Xjsr305=strict")
    }
}

tasks.withType<Test> {
    useJUnitPlatform()
    // Pass -PexcludeIntegrationTests to skip the Spring context integration test
    // (HomelabBackendApplicationTests), which needs a running Postgres. Handy for unit-test-only
    // runs / coverage on a machine without a database.
    if (project.hasProperty("excludeIntegrationTests")) {
        filter { excludeTestsMatching("*HomelabBackendApplicationTests*") }
    }
}

// Aggregate the homelab-sdk subproject's coverage into the same report as the core app.
dependencies {
    kover(project(":homelab-sdk"))
}

kover {
    reports {
        filters {
            excludes {
                // Spring Boot entrypoint: untestable boilerplate that only boots the container.
                classes("com.homelab.core.HomelabBackendApplication", "com.homelab.core.HomelabBackendApplicationKt")
            }
        }
    }
}
