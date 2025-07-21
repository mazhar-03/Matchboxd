using System.ComponentModel.DataAnnotations;

namespace Matchboxd.API.Dtos;

public class CreateRatingCommentDto
{
    [Required]
    public int UserId { get; set; }

    [Range(0.5, 5.0)]
    public double? Score { get; set; } // Optional

    public string? Content { get; set; } // Optional
}

public class CreateFavoriteDto
{
    [Required] public int UserId { get; set; }
}