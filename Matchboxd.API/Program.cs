using System.Security.Claims;
using System.Text;
using Matchboxd.API.DAL;
using Matchboxd.API.Helpers.Options;
using Matchboxd.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var config = builder.Configuration;

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(MyAllowSpecificOrigins,
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});

builder.Services.AddHttpClient("FootballData", client =>
{
    client.BaseAddress = new Uri(config["FootballDataApi:BaseUrl"] ?? string.Empty);
    client.DefaultRequestHeaders.Add("X-Auth-Token", config["FootballDataApi:ApiKey"]);
});

var con = builder.Configuration.GetConnectionString("UniversityDatabase")
          ?? throw new Exception("University connection string is not found!");

var jwtConfigData = builder.Configuration.GetSection("Jwt");
builder.Services.Configure<JwtOptions>(jwtConfigData);

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<EmailService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtConfigData["Issuer"],
            ValidAudience = jwtConfigData["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtConfigData["Key"])),
            ClockSkew = TimeSpan.FromMinutes(20),

            // I tried everything but everytime I got Unauthorized. Without that i did not make it to recognize the username for the system.
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(con));

builder.Services.AddScoped<MatchImportService>();
builder.Services.AddControllers();
builder.Services.AddAuthorization();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors(MyAllowSpecificOrigins);

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseStaticFiles(); 

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();


app.Run();