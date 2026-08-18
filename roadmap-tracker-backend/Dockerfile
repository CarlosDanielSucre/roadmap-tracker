# Estágio 1: build — usa uma imagem com Maven + JDK completos,
# só pra compilar o projeto e gerar o .jar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Estágio 2: runtime — imagem bem mais enxuta, só com o Java
# necessário pra RODAR o .jar, sem o peso do Maven/JDK completo
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
