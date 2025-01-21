# File Upload Examples

## Basic File Upload

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Upload a file to a ticket's attachments
const uploadTicketAttachment = async (
  ticketId: string,
  file: File,
  onProgress?: (progress: number) => void
) => {
  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `tickets/${ticketId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      onUploadProgress: (event) => {
        if (onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      },
    });

  if (error) throw error;

  // Get public URL for the file
  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(filePath);

  // Add attachment record to the database
  const { error: dbError } = await supabase
    .from('ticket_attachments')
    .insert({
      ticket_id: ticketId,
      file_name: fileName,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      public_url: publicUrl,
    });

  if (dbError) throw dbError;

  return { filePath, publicUrl };
};

// Example usage
try {
  const file = new File(['Hello, World!'], 'test.txt', { type: 'text/plain' });
  const { publicUrl } = await uploadTicketAttachment('123', file, (progress) => {
    console.log(`Upload progress: ${progress}%`);
  });
  console.log('File uploaded:', publicUrl);
} catch (error) {
  console.error('Upload failed:', error);
}
```

## Multiple File Upload

```typescript
// Upload multiple files
const uploadMultipleFiles = async (
  ticketId: string,
  files: File[],
  onProgress?: (fileName: string, progress: number) => void
) => {
  const uploads = files.map((file) =>
    uploadTicketAttachment(ticketId, file, (progress) => {
      onProgress?.(file.name, progress);
    })
  );

  return Promise.all(uploads);
};

// Example usage
try {
  const files = [
    new File(['Test 1'], 'test1.txt', { type: 'text/plain' }),
    new File(['Test 2'], 'test2.txt', { type: 'text/plain' }),
  ];

  const results = await uploadMultipleFiles('123', files, (fileName, progress) => {
    console.log(`${fileName}: ${progress}%`);
  });

  console.log('All files uploaded:', results);
} catch (error) {
  console.error('Upload failed:', error);
}
```

## React Integration

```typescript
import { useState } from 'react';

// Custom hook for file uploads
function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});

  const uploadFiles = async (ticketId: string, files: FileList | null) => {
    if (!files?.length) return;

    setUploading(true);
    setProgress({});

    try {
      const fileArray = Array.from(files);
      await uploadMultipleFiles(ticketId, fileArray, (fileName, fileProgress) => {
        setProgress((prev) => ({
          ...prev,
          [fileName]: fileProgress,
        }));
      });
    } finally {
      setUploading(false);
    }
  };

  return { uploadFiles, uploading, progress };
}

// File upload component
function TicketAttachments({ ticketId }: { ticketId: string }) {
  const { uploadFiles, uploading, progress } = useFileUpload();
  const [attachments, setAttachments] = useState<any[]>([]);

  // Fetch existing attachments
  useEffect(() => {
    const fetchAttachments = async () => {
      const { data, error } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId);

      if (!error && data) {
        setAttachments(data);
      }
    };

    fetchAttachments();
  }, [ticketId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await uploadFiles(ticketId, e.target.files);
      // Refresh attachments list
      const { data } = await supabase
        .from('ticket_attachments')
        .select('*')
        .eq('ticket_id', ticketId);

      if (data) {
        setAttachments(data);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {/* Upload Progress */}
      {uploading && (
        <div className="progress">
          {Object.entries(progress).map(([fileName, value]) => (
            <div key={fileName}>
              {fileName}: {value.toFixed(0)}%
            </div>
          ))}
        </div>
      )}

      {/* Attachments List */}
      <div className="attachments">
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment">
            <a href={attachment.public_url} target="_blank" rel="noopener noreferrer">
              {attachment.file_name}
            </a>
            <span className="size">
              ({(attachment.file_size / 1024).toFixed(1)} KB)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## File Download

```typescript
// Download a file
const downloadAttachment = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from('attachments')
    .download(filePath);

  if (error) throw error;

  // Create a download link
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filePath.split('/').pop() || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Example usage
try {
  await downloadAttachment('tickets/123/example.txt');
  console.log('Download complete');
} catch (error) {
  console.error('Download failed:', error);
}
``` 