# Instrucciones para generar APK (Expo EAS)

## 📦 Opción recomendada: EAS Build (APK en la nube)

### Requisitos previos
1) Cuenta en Expo: https://expo.dev/signup  
2) EAS CLI global: `npm install -g eas-cli`  
3) Archivo `mobile/.env` completo con tus URLs/keys (usa los EXPO_PUBLIC del entorno que quieras empaquetar).  
4) Proyecto ya vinculado a EAS (en `app.json` existe `extra.eas.projectId`). Si no, ejecuta `eas init` en `mobile/`.

### Pasos
1) Instala dependencias (si faltan):  
   ```bash
   cd mobile
   npm install
   ```
2) Inicia sesión en Expo:  
   ```bash
   eas login
   ```
3) (Opcional) Sube versión antes de un build nuevo: edita `mobile/app.json` y ajusta `version` y `android.versionCode` (+1).
4) Genera APK para testing (perfil `preview` ya usa `buildType: apk`):  
   ```bash
   eas build --platform android --profile preview
   ```
   - Sube el código a EAS, compila y devuelve un link de descarga del APK.
   - Tiempo típico: 5‑15 minutos en plan gratis.
5) Descarga el APK desde el link que muestra la terminal o en:  
   `https://expo.dev/accounts/<tu-usuario>/projects/bgai-app/builds`

### Otras variantes
- Perfil producción (también genera APK según `eas.json`):  
  ```bash
  eas build --platform android --profile production
  ```
- Si quisieras AAB para Play Store, cambia `android.buildType` a `"app-bundle"` en `eas.json` (no necesario para tu testing).

---

## 🛠️ Opción alternativa: build local con Android Studio
Solo si quieres compilar sin EAS (requiere Android Studio, SDK y JDK 17 instalados).

```bash
cd mobile
npx expo run:android --variant release   # genera APK en android/app/build/outputs/apk/release/
```

---

## 📝 Notas importantes
- **Entorno**: `mobile/.env` debe tener `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_BACKEND_URL` del entorno que quieras empaquetar. No uses `env.ts`.
- **Versión**: Incrementa `android.versionCode` y, si quieres, `version` en `app.json` para distinguir builds.
- **Firma**: EAS maneja el keystore automáticamente. Para Play Store, activa/signa en `eas credentials` (no necesario para APK interno).
- **Perfil preview**: ideal para testing interno; `production` es para builds más “finales” aunque también genere APK.

---

## 🚀 Comandos rápidos
```bash
# Build APK testing (perfil preview)
eas build --platform android --profile preview

# Build APK “final” (perfil production)
eas build --platform android --profile production

# Listar builds
eas build:list

# Ver detalles de un build
eas build:view <BUILD_ID>
```
