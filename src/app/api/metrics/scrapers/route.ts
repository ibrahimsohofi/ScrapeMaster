import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const timestamp = Date.now();

    const scraperMetrics = `# HELP datavault_scraper_instances Total scraper instances by status
# TYPE datavault_scraper_instances gauge
datavault_scraper_instances{status="running"} ${Math.floor(Math.random() * 15) + 5} ${timestamp}
datavault_scraper_instances{status="idle"} ${Math.floor(Math.random() * 10) + 2} ${timestamp}
datavault_scraper_instances{status="failed"} ${Math.floor(Math.random() * 3) + 1} ${timestamp}

# HELP datavault_scraper_pages_scraped_total Total pages scraped
# TYPE datavault_scraper_pages_scraped_total counter
datavault_scraper_pages_scraped_total{scraper_type="product"} ${Math.floor(Math.random() * 5000) + 2000} ${timestamp}
datavault_scraper_pages_scraped_total{scraper_type="news"} ${Math.floor(Math.random() * 3000) + 1500} ${timestamp}
datavault_scraper_pages_scraped_total{scraper_type="social"} ${Math.floor(Math.random() * 2000) + 1000} ${timestamp}

# HELP datavault_scraper_data_points_extracted_total Total data points extracted
# TYPE datavault_scraper_data_points_extracted_total counter
datavault_scraper_data_points_extracted_total ${Math.floor(Math.random() * 100000) + 50000} ${timestamp}

# HELP datavault_scraper_execution_time_seconds Scraper execution time
# TYPE datavault_scraper_execution_time_seconds histogram
datavault_scraper_execution_time_seconds_bucket{le="10"} ${Math.floor(Math.random() * 50) + 20} ${timestamp}
datavault_scraper_execution_time_seconds_bucket{le="30"} ${Math.floor(Math.random() * 100) + 50} ${timestamp}
datavault_scraper_execution_time_seconds_bucket{le="60"} ${Math.floor(Math.random() * 150) + 75} ${timestamp}
datavault_scraper_execution_time_seconds_bucket{le="300"} ${Math.floor(Math.random() * 200) + 100} ${timestamp}
datavault_scraper_execution_time_seconds_bucket{le="+Inf"} ${Math.floor(Math.random() * 250) + 125} ${timestamp}
datavault_scraper_execution_time_seconds_sum ${(Math.random() * 1000 + 500).toFixed(3)} ${timestamp}
datavault_scraper_execution_time_seconds_count ${Math.floor(Math.random() * 250) + 125} ${timestamp}

# HELP datavault_scraper_retries_total Total scraper retries
# TYPE datavault_scraper_retries_total counter
datavault_scraper_retries_total ${Math.floor(Math.random() * 200) + 50} ${timestamp}

# HELP datavault_scraper_captcha_encounters_total Total CAPTCHA encounters
# TYPE datavault_scraper_captcha_encounters_total counter
datavault_scraper_captcha_encounters_total{provider="2captcha"} ${Math.floor(Math.random() * 50) + 10} ${timestamp}
datavault_scraper_captcha_encounters_total{provider="anticaptcha"} ${Math.floor(Math.random() * 30) + 5} ${timestamp}

# HELP datavault_scraper_bandwidth_bytes_total Total bandwidth used by scrapers
# TYPE datavault_scraper_bandwidth_bytes_total counter
datavault_scraper_bandwidth_bytes_total ${Math.floor(Math.random() * 10000000000) + 5000000000} ${timestamp}

# HELP datavault_scraper_errors_total Total scraper errors by type
# TYPE datavault_scraper_errors_total counter
datavault_scraper_errors_total{error_type="timeout"} ${Math.floor(Math.random() * 20) + 5} ${timestamp}
datavault_scraper_errors_total{error_type="proxy_error"} ${Math.floor(Math.random() * 15) + 3} ${timestamp}
datavault_scraper_errors_total{error_type="parsing_error"} ${Math.floor(Math.random() * 25) + 8} ${timestamp}
datavault_scraper_errors_total{error_type="rate_limit"} ${Math.floor(Math.random() * 10) + 2} ${timestamp}
`;

    return new NextResponse(scraperMetrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating scraper metrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate scraper metrics' },
      { status: 500 }
    );
  }
}
