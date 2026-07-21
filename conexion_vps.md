# Conexión al VPS de Hostinger

Este documento contiene la información necesaria para acceder al servidor VPS de Hostinger donde se aloja el proyecto, especialmente configurado para permitir el acceso a través de una VPN.

## Datos de Conexión

*   **Host/IP:** `YOUR_VPS_IP`
*   **Usuario:** `root`
*   **Puerto SSH:** `22` (El puerto 22 por defecto está cerrado por seguridad y bloqueos del panel).
*   **Autenticación:** Clave pública (Public Key / SSH Key).

## Comando de Acceso

Para conectarte desde tu terminal local (incluso con tu VPN, como ProtonVPN, encendida), utiliza el siguiente comando:

```bash
ssh -p 22 root@YOUR_VPS_IP
```

## Notas sobre el Firewall

Esta configuración fue necesaria debido a bloqueos predeterminados. El entorno actual tiene las siguientes reglas aplicadas:

1.  **Panel Web de Hostinger:** El firewall perimetral tiene una regla que bloquea todo el tráfico entrante, **excepto** los puertos: `80` (HTTP), `443` (HTTPS), `5678` (n8n), y `22` (SSH personalizado).
2.  **Servidor Interno (Debian):** El servicio `sshd` fue reconfigurado (`/etc/ssh/sshd_config`) para escuchar exclusivamente en el puerto `22`. El firewall interno (`iptables`) tiene una regla prioritaria (`ACCEPT`) para permitir el tráfico TCP entrante en ese puerto.
