// A preciser, ce service sert a faire le lien
//  pour tenir le legacy, une evolution vers notre but de cloud stockage de photo est nécessaire

class ImageService {
    static async fetchPhotos() {
        try {
            console.log("Fetching photos...");
            const res = await fetch('/api/photos', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });
            console.log("Response received:", res);
            const data = await res.json();
            console.log("Photos fetched:", data);
            if (Array.isArray(data)) {
                return data;
            }
            return [];
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    static async deletePhoto(photoName: string) {
        try {
            const res = await fetch(`/api/photos/${encodeURIComponent(photoName)}`, { method: 'DELETE' });
            return res.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async uploadPhoto(file: File) {
        try {
            const formData = new FormData();
            formData.append('photo', file);
            const res = await fetch('/api/photos', { method: 'POST', body: formData });
            return res.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async uploadPhotos(files: FileList) {
        for (const file of Array.from(files)) {
            const fd = new FormData();
            fd.append('photo', file);
            fd.append('lastModified', String(file.lastModified));
            try {
                await fetch('/api/photos', { method: 'POST', body: fd });
            } catch {
                // Ignore per-file upload errors and continue other files.
            }
        }
    }

}

export default ImageService;