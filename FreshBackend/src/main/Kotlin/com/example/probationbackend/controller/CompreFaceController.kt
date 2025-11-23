// src/main/kotlin/com/example/probationbackend/controller/CompreFaceController.kt
package com.example.probationbackend.controller

import org.springframework.http.*
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile
import org.springframework.web.client.RestTemplate
import org.springframework.web.client.HttpClientErrorException
import org.springframework.core.io.ByteArrayResource
import org.springframework.util.LinkedMultiValueMap
import org.springframework.util.MultiValueMap
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/api/compreface")
@CrossOrigin(origins = ["*"])
class CompreFaceController {

    private val logger = LoggerFactory.getLogger(CompreFaceController::class.java)
    private val restTemplate = RestTemplate()

    // CompreFace настройки - ОБНОВИТЕ на ваши
    private val compreFaceUrl = "http://localhost:8000" // URL CompreFace
    private val apiKey = "your-api-key-here" // Ваш API ключ из CompreFace

    /**
     * Регистрация нового лица
     * POST /api/compreface/add-face/{userId}
     */
    @PostMapping("/add-face/{userId}")
    fun addFace(
        @PathVariable userId: String,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<Map<String, Any>> {
        try {
            logger.info("Adding face for user: $userId")

            // Подготовка multipart запроса
            val headers = HttpHeaders()
            headers.contentType = MediaType.MULTIPART_FORM_DATA
            headers.set("x-api-key", apiKey)

            val body: MultiValueMap<String, Any> = LinkedMultiValueMap()
            body.add("file", object : ByteArrayResource(file.bytes) {
                override fun getFilename(): String {
                    return file.originalFilename ?: "image.jpg"
                }
            })

            val requestEntity = HttpEntity(body, headers)

            // Отправка запроса в CompreFace
            val url = "$compreFaceUrl/api/v1/recognition/faces?subject=$userId"
            val response = restTemplate.postForEntity(
                url,
                requestEntity,
                Map::class.java
            )

            logger.info("CompreFace add face response: ${response.statusCode}")

            return ResponseEntity.ok(mapOf(
                "success" to true,
                "message" to "Face registered successfully",
                "data" to (response.body ?: emptyMap<String, Any>())
            ))

        } catch (e: HttpClientErrorException) {
            logger.error("CompreFace add face error: ${e.message}")
            return ResponseEntity.status(e.statusCode).body(mapOf(
                "success" to false,
                "error" to (e.responseBodyAsString ?: e.message),
                "message" to "Failed to add face"
            ))
        } catch (e: Exception) {
            logger.error("Add face error", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false,
                "error" to e.message,
                "message" to "Internal server error"
            ))
        }
    }

    /**
     * Верификация лица - сравнение с зарегистрированным
     * POST /api/compreface/verify/{userId}
     */
    @PostMapping("/verify/{userId}")
    fun verifyFace(
        @PathVariable userId: String,
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<Map<String, Any>> {
        try {
            logger.info("Verifying face for user: $userId")

            // Подготовка multipart запроса
            val headers = HttpHeaders()
            headers.contentType = MediaType.MULTIPART_FORM_DATA
            headers.set("x-api-key", apiKey)

            val body: MultiValueMap<String, Any> = LinkedMultiValueMap()
            body.add("file", object : ByteArrayResource(file.bytes) {
                override fun getFilename(): String {
                    return file.originalFilename ?: "image.jpg"
                }
            })

            val requestEntity = HttpEntity(body, headers)

            // Отправка запроса в CompreFace для распознавания
            val url = "$compreFaceUrl/api/v1/recognition/recognize?limit=1&det_prob_threshold=0.8&face_plugins=age,gender,mask&status=true"
            val response = restTemplate.postForEntity(
                url,
                requestEntity,
                Map::class.java
            )

            logger.info("CompreFace verify response: ${response.statusCode}")

            val responseBody = response.body as? Map<*, *>
            val result = responseBody?.get("result") as? List<*>

            if (result.isNullOrEmpty()) {
                return ResponseEntity.ok(mapOf(
                    "success" to true,
                    "verified" to false,
                    "similarity" to 0.0,
                    "message" to "No face detected or not found in database"
                ))
            }

            val firstResult = result[0] as? Map<*, *>
            val subjects = firstResult?.get("subjects") as? List<*>

            if (subjects.isNullOrEmpty()) {
                return ResponseEntity.ok(mapOf(
                    "success" to true,
                    "verified" to false,
                    "similarity" to 0.0,
                    "message" to "Face not found in database"
                ))
            }

            // Проверяем совпадение с userId
            val matchedSubject = subjects.firstOrNull { subject ->
                (subject as? Map<*, *>)?.get("subject") == userId
            } as? Map<*, *>

            if (matchedSubject != null) {
                val similarity = matchedSubject["similarity"] as? Double ?: 0.0
                val verified = similarity >= 0.7 // Порог 70%

                return ResponseEntity.ok(mapOf(
                    "success" to true,
                    "verified" to verified,
                    "similarity" to similarity,
                    "confidence" to similarity,
                    "message" to if (verified) "Face verified successfully" else "Face similarity too low",
                    "data" to responseBody
                ))
            } else {
                return ResponseEntity.ok(mapOf(
                    "success" to true,
                    "verified" to false,
                    "similarity" to 0.0,
                    "message" to "User face not found in results"
                ))
            }

        } catch (e: HttpClientErrorException) {
            logger.error("CompreFace verify error: ${e.message}")
            return ResponseEntity.status(e.statusCode).body(mapOf(
                "success" to false,
                "error" to (e.responseBodyAsString ?: e.message),
                "message" to "Verification failed"
            ))
        } catch (e: Exception) {
            logger.error("Verify face error", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false,
                "error" to e.message,
                "message" to "Internal server error"
            ))
        }
    }

    /**
     * Распознавание лица - поиск среди всех зарегистрированных
     * POST /api/compreface/recognize
     */
    @PostMapping("/recognize")
    fun recognizeFace(
        @RequestParam("file") file: MultipartFile
    ): ResponseEntity<Map<String, Any>> {
        try {
            logger.info("Recognizing face...")

            // Подготовка multipart запроса
            val headers = HttpHeaders()
            headers.contentType = MediaType.MULTIPART_FORM_DATA
            headers.set("x-api-key", apiKey)

            val body: MultiValueMap<String, Any> = LinkedMultiValueMap()
            body.add("file", object : ByteArrayResource(file.bytes) {
                override fun getFilename(): String {
                    return file.originalFilename ?: "image.jpg"
                }
            })

            val requestEntity = HttpEntity(body, headers)

            // Отправка запроса в CompreFace
            val url = "$compreFaceUrl/api/v1/recognition/recognize?limit=5&det_prob_threshold=0.8&face_plugins=age,gender,mask&status=true"
            val response = restTemplate.postForEntity(
                url,
                requestEntity,
                Map::class.java
            )

            logger.info("CompreFace recognize response: ${response.statusCode}")

            return ResponseEntity.ok(mapOf(
                "success" to true,
                "data" to (response.body ?: emptyMap<String, Any>())
            ))

        } catch (e: HttpClientErrorException) {
            logger.error("CompreFace recognize error: ${e.message}")
            return ResponseEntity.status(e.statusCode).body(mapOf(
                "success" to false,
                "error" to (e.responseBodyAsString ?: e.message),
                "message" to "Recognition failed"
            ))
        } catch (e: Exception) {
            logger.error("Recognize face error", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false,
                "error" to e.message,
                "message" to "Internal server error"
            ))
        }
    }

    /**
     * Удаление лица
     * DELETE /api/compreface/delete-all-faces/{userId}
     */
    @DeleteMapping("/delete-all-faces/{userId}")
    fun deleteAllFaces(@PathVariable userId: String): ResponseEntity<Map<String, Any>> {
        try {
            logger.info("Deleting all faces for user: $userId")

            val headers = HttpHeaders()
            headers.set("x-api-key", apiKey)

            val requestEntity = HttpEntity<String>(headers)

            // Отправка запроса в CompreFace
            val url = "$compreFaceUrl/api/v1/recognition/faces?subject=$userId"
            restTemplate.exchange(
                url,
                HttpMethod.DELETE,
                requestEntity,
                Map::class.java
            )

            return ResponseEntity.ok(mapOf(
                "success" to true,
                "message" to "All faces deleted for user $userId"
            ))

        } catch (e: HttpClientErrorException) {
            logger.error("CompreFace delete error: ${e.message}")
            return ResponseEntity.status(e.statusCode).body(mapOf(
                "success" to false,
                "error" to (e.responseBodyAsString ?: e.message),
                "message" to "Delete failed"
            ))
        } catch (e: Exception) {
            logger.error("Delete face error", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false,
                "error" to e.message,
                "message" to "Internal server error"
            ))
        }
    }

    /**
     * Получение списка всех зарегистрированных лиц
     * GET /api/compreface/faces
     */
    @GetMapping("/faces")
    fun listFaces(): ResponseEntity<Map<String, Any>> {
        try {
            logger.info("Listing all faces...")

            val headers = HttpHeaders()
            headers.set("x-api-key", apiKey)

            val requestEntity = HttpEntity<String>(headers)

            // Отправка запроса в CompreFace
            val url = "$compreFaceUrl/api/v1/recognition/subjects"
            val response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                requestEntity,
                Map::class.java
            )

            logger.info("CompreFace list faces response: ${response.statusCode}")

            return ResponseEntity.ok(mapOf(
                "success" to true,
                "faces" to (response.body?.get("subjects") ?: emptyList<String>())
            ))

        } catch (e: HttpClientErrorException) {
            logger.error("CompreFace list faces error: ${e.message}")
            return ResponseEntity.status(e.statusCode).body(mapOf(
                "success" to false,
                "error" to (e.responseBodyAsString ?: e.message),
                "message" to "List faces failed"
            ))
        } catch (e: Exception) {
            logger.error("List faces error", e)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(mapOf(
                "success" to false,
                "error" to e.message,
                "message" to "Internal server error"
            ))
        }
    }
}
