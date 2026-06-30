using AccountBook.Core.Interfaces;
using AccountBook.Shared.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AccountBook.Api.Controllers;

[ApiController]
[Route("api/payment-method-types")]
[Authorize]
public class PaymentMethodTypesController : ControllerBase
{
    private readonly IPaymentMethodTypeService _paymentMethodTypeService;
    private readonly IFeedbackService _feedbackService;

    public PaymentMethodTypesController(
        IPaymentMethodTypeService paymentMethodTypeService,
        IFeedbackService feedbackService)
    {
        _paymentMethodTypeService = paymentMethodTypeService;
        _feedbackService = feedbackService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(userIdClaim?.Value ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<List<PaymentMethodTypeDto>>> GetVisibleList()
    {
        var list = await _paymentMethodTypeService.GetVisibleListAsync();
        return Ok(list);
    }

    [HttpGet("admin")]
    public async Task<ActionResult<List<PaymentMethodTypeAdminDto>>> GetAdminList()
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        var list = await _paymentMethodTypeService.GetAdminListAsync();
        return Ok(list);
    }

    [HttpPost("admin")]
    public async Task<ActionResult<PaymentMethodTypeAdminDto>> AdminCreate([FromBody] CreatePaymentMethodTypeRequest request)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            var created = await _paymentMethodTypeService.AdminCreateAsync(request);
            return Ok(created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("admin/{id:int}")]
    public async Task<ActionResult<PaymentMethodTypeAdminDto>> AdminUpdate(int id, [FromBody] CreatePaymentMethodTypeRequest request)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            var updated = await _paymentMethodTypeService.AdminUpdateAsync(id, request);
            if (updated == null)
                return NotFound();
            return Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("admin/reorder")]
    public async Task<IActionResult> AdminReorder([FromBody] ReorderPaymentMethodTypesRequest request)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            await _paymentMethodTypeService.AdminReorderAsync(request);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("admin/{id:int}")]
    public async Task<IActionResult> AdminDelete(int id)
    {
        var userId = GetUserId();
        if (!await _feedbackService.IsAdminAsync(userId))
            return Forbid();
        try
        {
            var ok = await _paymentMethodTypeService.AdminDeleteAsync(id);
            if (!ok)
                return NotFound();
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
