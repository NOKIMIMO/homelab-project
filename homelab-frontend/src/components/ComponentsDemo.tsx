import React, { useState } from 'react';
import {
  Header,
  ActionBar,
  Button,
  IconButton,
  FileUploadZone,
  List,
  ListItem,
  Modal,
  ImageViewer,
} from './index';
import './components.css';

interface Photo {
  id: string;
  file_name: string;
  size: number;
  upload_date: string;
  url: string;
}

const MOCK_PHOTOS: Photo[] = [
  {
    id: '1',
    file_name: 'sunset.jpg',
    size: 2048576,
    upload_date: '2024-05-20',
    url: 'https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=400',
  },
  {
    id: '2',
    file_name: 'mountain.jpg',
    size: 3145728,
    upload_date: '2024-05-21',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
  },
  {
    id: '3',
    file_name: 'ocean.jpg',
    size: 1572864,
    upload_date: '2024-05-22',
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400',
  },
];

export const ComponentsDemo: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>(MOCK_PHOTOS);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [fullscreenPhotoId, setFullscreenPhotoId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const handleUpload = (files: File[]) => {
    setUploading(true);
    setTimeout(() => {
      const newPhoto: Photo = {
        id: String(photos.length + 1),
        file_name: files[0]?.name || 'new_photo.jpg',
        size: files[0]?.size || 0,
        upload_date: new Date().toISOString().split('T')[0],
        url: URL.createObjectURL(files[0]),
      };
      setPhotos([...photos, newPhoto]);
      setUploading(false);
      setShowNotification(`✓ ${files[0]?.name || 'Photo'} uploadée avec succès!`);
      setTimeout(() => setShowNotification(null), 3000);
    }, 1500);
  };

  const handleRefresh = () => {
    setShowNotification('↻ Liste actualisée');
    setTimeout(() => setShowNotification(null), 2000);
  };

  const handleSelectPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
  };

  const handleFullscreen = (photoId: string) => {
    setFullscreenPhotoId(photoId);
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter((p) => p.id !== photoId));
    setShowNotification(`✓ Photo supprimée`);
    setTimeout(() => setShowNotification(null), 2000);
  };

  const fullscreenPhoto = photos.find((p) => p.id === fullscreenPhotoId);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="components-demo">
      {/* Notification */}
      {showNotification && (
        <div className="notification">
          {showNotification}
        </div>
      )}

      {/* Header */}
      <Header title="Stockage Photo - Demo" />

      {/* ActionBar */}
      <ActionBar>
        <Button
          label="Upload photo"
          icon="📤"
          disabled={uploading}
        />
        <Button
          label="Refresh"
          icon="🔄"
          onClick={handleRefresh}
          disabled={uploading}
        />
      </ActionBar>

      {/* FileUploadZone */}
      <div className="demo-section">
        <h3>Zone de dépôt de fichiers</h3>
        <FileUploadZone
          accept="image/*"
          multiple={false}
          onFilesSelected={handleUpload}
        />
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="upload-status">
          <div className="spinner"></div>
          <span>Upload en cours...</span>
        </div>
      )}

      {/* List of Photos */}
      <div className="demo-section">
        <h3>Liste des photos ({photos.length})</h3>
        {photos.length === 0 ? (
          <div className="empty-state">
            <p>Aucune photo. Uploadez-en une pour commencer.</p>
          </div>
        ) : (
          <List
            items={photos}
            keyExtractor={(photo) => photo.id}
            renderItem={(photo) => (
              <ListItem
                title={photo.file_name}
                subtitle={`ID: ${photo.id} • ${formatFileSize(photo.size)} • ${photo.upload_date}`}
                clickable={true}
                onClick={() => handleSelectPhoto(photo)}
                actions={
                  <div className="list-actions">
                    <IconButton
                      icon="🔍"
                      tooltip="Agrandir"
                      onClick={() => handleFullscreen(photo.id)}
                    />
                    <IconButton
                      icon="🗑️"
                      tooltip="Supprimer"
                      onClick={() => handleDeletePhoto(photo.id)}
                    />
                  </div>
                }
              />
            )}
          />
        )}
      </div>

      {/* Selected Photo Details */}
      {selectedPhoto && (
        <div className="demo-section selected-photo">
          <h3>Détails de la photo sélectionnée</h3>
          <div className="photo-details">
            <ImageViewer
              src={selectedPhoto.url}
              alt={selectedPhoto.file_name}
            />
            <div className="photo-info">
              <p>
                <strong>Nom:</strong> {selectedPhoto.file_name}
              </p>
              <p>
                <strong>ID:</strong> {selectedPhoto.id}
              </p>
              <p>
                <strong>Taille:</strong> {formatFileSize(selectedPhoto.size)}
              </p>
              <p>
                <strong>Date:</strong> {selectedPhoto.upload_date}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      <Modal
        visible={fullscreenPhotoId !== null}
        title="Visualisation agrandie"
        onClose={() => setFullscreenPhotoId(null)}
        actions={
          <Button
            label="Fermer"
            onClick={() => setFullscreenPhotoId(null)}
          />
        }
      >
        {fullscreenPhoto && (
          <ImageViewer
            src={fullscreenPhoto.url}
            alt={fullscreenPhoto.file_name}
          />
        )}
      </Modal>

      {/* Components Reference */}
      <div className="demo-section components-reference">
        <h3>Référence des composants</h3>
        <div className="components-grid">
          <div className="component-card">
            <h4>Header</h4>
            <p>Affiche un titre principal</p>
          </div>
          <div className="component-card">
            <h4>ActionBar</h4>
            <p>Conteneur pour les actions principales</p>
          </div>
          <div className="component-card">
            <h4>Button</h4>
            <p>Bouton d'action standard</p>
          </div>
          <div className="component-card">
            <h4>IconButton</h4>
            <p>Bouton compacte avec icône</p>
          </div>
          <div className="component-card">
            <h4>FileUploadZone</h4>
            <p>Zone de dépôt avec glisser-déposer</p>
          </div>
          <div className="component-card">
            <h4>List</h4>
            <p>Conteneur pour une liste d'éléments</p>
          </div>
          <div className="component-card">
            <h4>ListItem</h4>
            <p>Élément individuel dans une liste</p>
          </div>
          <div className="component-card">
            <h4>Modal</h4>
            <p>Fenêtre modale pour le contenu</p>
          </div>
          <div className="component-card">
            <h4>ImageViewer</h4>
            <p>Afficheur d'image avec support du chargement</p>
          </div>
        </div>
      </div>
    </div>
  );
};
