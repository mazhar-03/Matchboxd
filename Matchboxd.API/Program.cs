using Matchboxd.API.DAL;
using Matchboxd.API.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var config = builder.Configuration;

builder.Services.AddHttpClient("FootballData", client =>
{
    client.BaseAddress = new Uri(config["FootballDataApi:BaseUrl"] ?? string.Empty);
    client.DefaultRequestHeaders.Add("X-Auth-Token", config["FootballDataApi:ApiKey"]);
});

var con = builder.Configuration.GetConnectionString("UniversityDatabase")
          ?? throw new Exception("University connection string is not found!");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(con));

builder.Services.AddScoped<MatchImportService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();
app.UseHttpsRedirection();


app.Run();