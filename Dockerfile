# 构建阶段
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY AccountBook.sln ./
COPY src/AccountBook.Api/AccountBook.Api.csproj src/AccountBook.Api/
COPY src/AccountBook.Core/AccountBook.Core.csproj src/AccountBook.Core/
COPY src/AccountBook.Infrastructure/AccountBook.Infrastructure.csproj src/AccountBook.Infrastructure/
COPY src/AccountBook.Shared/AccountBook.Shared.csproj src/AccountBook.Shared/

RUN dotnet restore src/AccountBook.Api/AccountBook.Api.csproj

COPY src/ src/
# 避免 Windows 本机构建的 obj/bin 覆盖容器内 restore 结果
RUN find src -type d \( -name obj -o -name bin \) -prune -exec rm -rf {} +
RUN dotnet publish src/AccountBook.Api/AccountBook.Api.csproj \
    -c Release \
    -o /app/publish

# 运行阶段
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

RUN mkdir -p /app/logs

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "AccountBook.Api.dll"]
