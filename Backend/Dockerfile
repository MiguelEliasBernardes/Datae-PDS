# Imagem da API para a Render (que não roda .NET direto, só por Docker).
# Construção em duas etapas: o SDK compila e publica; a imagem final leva só o runtime e o resultado.

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS construcao
WORKDIR /src

# Restaura os pacotes antes de copiar o resto, para o Docker reaproveitar essa etapa entre as versões
COPY Backend.csproj ./
RUN dotnet restore Backend.csproj

COPY . ./
RUN dotnet publish Backend.csproj --configuration Release --output /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=construcao /app ./

# A Render descobre a porta aberta sozinha; 8080 é a padrão das imagens do .NET
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Backend.dll"]
