package com.example.probationbackend.controller

import com.example.probationbackend.repository.DevicePositionRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

/**
 * API для получения GPS позиций устройств
 * Frontend получает данные ТОЛЬКО от Backend, НЕ напрямую из Traccar!
 *
 * Endpoints:
 * GET /api/positions/latest - последние позиции всех устройств
 * GET /api/positions/{uniqueId}/latest - последняя позиция конкретного устройства
 * GET /api/positions/{uniqueId}/history - история позиций устройства
 */
@RestController
@RequestMapping("/api/positions")
class PositionController(
    private val devicePositionRepository: DevicePositionRepository
) {

    /**
     * Получить последние позиции ВСЕХ устройств
     * Используется для отображения всех устройств на карте
     *
     * GET /api/positions/latest
     *
     * Response:
     * {
     *   "status": "success",
     *   "count": 5,
     *   "positions": [
     *     {
     *       "uniqueId": "1234567890123",
     *       "latitude": 42.88,
     *       "longitude": 74.68,
     *       "speed": 0.0,
     *       "timestamp": "2025-11-28T12:00:00",
     *       "status": "online",
     *       "battery": 85.0
     *     },
     *     ...
     *   ]
     * }
     */
    @GetMapping("/latest")
    fun getLatestPositions(): ResponseEntity<*> {
        val positions = devicePositionRepository.findLatestPositionsForAllDevices()

        val positionsData = positions.map { pos ->
            mapOf(
                "id" to pos.id,
                "deviceId" to pos.deviceId,
                "uniqueId" to pos.uniqueId,
                "latitude" to pos.latitude,
                "longitude" to pos.longitude,
                "speed" to pos.speed,
                "bearing" to pos.bearing,
                "altitude" to pos.altitude,
                "accuracy" to pos.accuracy,
                "battery" to pos.battery,
                "timestamp" to pos.timestamp.toString(),
                "serverTime" to pos.serverTime.toString(),
                "status" to if (pos.isOnline()) "online" else "offline",
                "sentToTraccar" to pos.sentToTraccar
            )
        }

        return ResponseEntity.ok(mapOf(
            "status" to "success",
            "count" to positions.size,
            "positions" to positionsData
        ))
    }

    /**
     * Получить последнюю позицию конкретного устройства
     *
     * GET /api/positions/{uniqueId}/latest
     *
     * Response:
     * {
     *   "status": "success",
     *   "position": {
     *     "uniqueId": "1234567890123",
     *     "latitude": 42.88,
     *     "longitude": 74.68,
     *     ...
     *   }
     * }
     */
    @GetMapping("/{uniqueId}/latest")
    fun getLatestPosition(@PathVariable uniqueId: String): ResponseEntity<*> {
        val position = devicePositionRepository.findTopByUniqueIdOrderByTimestampDesc(uniqueId)

        if (position.isEmpty) {
            return ResponseEntity.ok(mapOf(
                "status" to "not_found",
                "message" to "No position data for device: $uniqueId"
            ))
        }

        val pos = position.get()

        return ResponseEntity.ok(mapOf(
            "status" to "success",
            "position" to mapOf(
                "id" to pos.id,
                "deviceId" to pos.deviceId,
                "uniqueId" to pos.uniqueId,
                "latitude" to pos.latitude,
                "longitude" to pos.longitude,
                "speed" to pos.speed,
                "bearing" to pos.bearing,
                "altitude" to pos.altitude,
                "accuracy" to pos.accuracy,
                "battery" to pos.battery,
                "timestamp" to pos.timestamp.toString(),
                "serverTime" to pos.serverTime.toString(),
                "status" to if (pos.isOnline()) "online" else "offline",
                "sentToTraccar" to pos.sentToTraccar
            )
        ))
    }

    /**
     * Получить историю позиций устройства за период
     *
     * GET /api/positions/{uniqueId}/history?from=2025-11-28T00:00:00&to=2025-11-28T23:59:59
     *
     * Response:
     * {
     *   "status": "success",
     *   "count": 120,
     *   "positions": [...]
     * }
     */
    @GetMapping("/{uniqueId}/history")
    fun getPositionHistory(
        @PathVariable uniqueId: String,
        @RequestParam(required = false) from: String?,
        @RequestParam(required = false) to: String?
    ): ResponseEntity<*> {
        val startTime = from?.let { LocalDateTime.parse(it) } ?: LocalDateTime.now().minusDays(1)
        val endTime = to?.let { LocalDateTime.parse(it) } ?: LocalDateTime.now()

        val positions = devicePositionRepository.findByUniqueIdAndTimestampBetweenOrderByTimestampDesc(
            uniqueId, startTime, endTime
        )

        val positionsData = positions.map { pos ->
            mapOf(
                "latitude" to pos.latitude,
                "longitude" to pos.longitude,
                "speed" to pos.speed,
                "timestamp" to pos.timestamp.toString()
            )
        }

        return ResponseEntity.ok(mapOf(
            "status" to "success",
            "count" to positions.size,
            "from" to startTime.toString(),
            "to" to endTime.toString(),
            "positions" to positionsData
        ))
    }

    /**
     * Получить онлайн устройства (последняя позиция не старше 5 минут)
     *
     * GET /api/positions/online
     */
    @GetMapping("/online")
    fun getOnlineDevices(): ResponseEntity<*> {
        val fiveMinutesAgo = LocalDateTime.now().minusMinutes(5)
        val onlinePositions = devicePositionRepository.findOnlineDevices(fiveMinutesAgo)

        val positionsData = onlinePositions.map { pos ->
            mapOf(
                "uniqueId" to pos.uniqueId,
                "latitude" to pos.latitude,
                "longitude" to pos.longitude,
                "timestamp" to pos.timestamp.toString(),
                "status" to "online"
            )
        }

        return ResponseEntity.ok(mapOf(
            "status" to "success",
            "count" to onlinePositions.size,
            "devices" to positionsData
        ))
    }
}
