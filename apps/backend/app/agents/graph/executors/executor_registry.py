

from app.agents.graph.executors.pdf_executor import run_pdf_executor
from app.agents.graph.executors.web_executor import run_web_executor


EXECUTOR_MAP = {
    "pdf_search": run_pdf_executor,
    "web_search": run_web_executor
}