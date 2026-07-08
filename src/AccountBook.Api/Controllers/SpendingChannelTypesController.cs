using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AccountBook.Api.Controllers;

[ApiController]
[Route("api/spending-channel-types")]
[Authorize]
public class SpendingChannelTypesController : ControllerBase
{
    private readonly ISpendingChannelTypeService _spendingChannelTypeService;

    public SpendingChannelTypesController(ISpendingChannelTypeService spendingChannelTypeService)
    {
        _spendingChannelTypeService = spendingChannelTypeService;
    }

    [HttpGet]
    public async Task<ActionResult<List<SpendingChannelTypeDto>>> GetVisibleList()
    {
        var list = await _spendingChannelTypeService.GetVisibleListAsync();
        return Ok(list);
    }
}
