document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.increase-expiration').forEach(button => {
        button.addEventListener('click', async (event) => {
            const row = event.target.closest('tr');
            const linkId = row.dataset.id;

            try {
                const response = await fetch(`/api/shared-links/increase-expiration/${linkId}`, { method: 'PUT' });
                if (response.ok) {
                    location.reload();
                } else {
                    console.error('Failed to increase expiration');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });

    document.querySelectorAll('.decrease-expiration').forEach(button => {
        button.addEventListener('click', async (event) => {
            const row = event.target.closest('tr');
            const linkId = row.dataset.id;

            try {
                const response = await fetch(`/api/shared-links/decrease-expiration/${linkId}`, { method: 'PUT' });
                if (response.ok) {
                    location.reload();
                } else {
                    console.error('Failed to decrease expiration');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });

    document.querySelectorAll('.delete-link').forEach(button => {
        button.addEventListener('click', async (event) => {
            const row = event.target.closest('tr');
            const linkId = row.dataset.id;

            try {
                const response = await fetch(`/api/shared-links/delete/${linkId}`, { method: 'DELETE' });
                if (response.ok) {
                    row.remove();
                } else {
                    console.error('Failed to delete link');
                }
            } catch (error) {
                console.error('Error:', error);
            }
        });
    });
});
