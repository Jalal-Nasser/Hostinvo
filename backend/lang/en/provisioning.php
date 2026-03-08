<?php

return [
    'server_connection_tested' => 'The server connection test completed successfully.',
    'server_connection_retry_dispatched' => 'A retry provisioning job has been queued from the failed attempt.',
    'cpanel' => [
        'credentials_missing' => 'The cPanel server credentials are incomplete. Set the WHM username and API token first.',
        'endpoint_missing' => 'The cPanel server endpoint is missing.',
        'endpoint_invalid' => 'The cPanel server endpoint is invalid.',
        'connection_successful' => 'The WHM connection test completed successfully.',
        'connection_failed' => 'Unable to connect to the WHM API.',
        'request_failed' => 'The cPanel operation :operation failed.',
        'invalid_response' => 'The cPanel API returned an invalid response.',
        'package_mapping_required' => 'No cPanel package mapping is available for this Hostinvo service.',
        'domain_required' => 'A primary domain is required before creating a cPanel account.',
        'username_required' => 'A cPanel username could not be resolved for this service.',
        'account_missing' => 'The cPanel account could not be found on the target server.',
        'account_created' => 'The cPanel account :username was created successfully.',
        'account_suspended' => 'The cPanel account :username was suspended successfully.',
        'account_unsuspended' => 'The cPanel account :username was unsuspended successfully.',
        'account_terminated' => 'The cPanel account :username was terminated successfully.',
        'package_changed' => 'The cPanel package for :username was changed successfully.',
        'password_reset' => 'The cPanel password for :username was reset successfully.',
        'usage_synced' => 'The cPanel usage data for :username was synchronized successfully.',
        'status_synced' => 'The cPanel service status for :username was synchronized successfully.',
    ],
];
